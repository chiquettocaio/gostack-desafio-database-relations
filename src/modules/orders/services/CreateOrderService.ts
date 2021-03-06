import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExists = await this.customersRepository.findById(customer_id)
    if (!customerExists) {
      throw new AppError('Could not find any customer with the given id')
    }

    const existentProducts = await this.productsRepository.findAllById(products)
    if (!existentProducts.length) {
      throw new AppError('Could not find any products with the given ids')
    }

    const existentProductsIds = existentProducts.map(p => p.id)
    const checkInexistentProducts = products.filter(p => !existentProductsIds.includes(p.id))

    if (checkInexistentProducts.length) {
      throw new AppError(`Could not find product ${checkInexistentProducts[0].id}`)
    }

    const findProductsWithNoQuantityAvailable = products
      .filter(p => existentProducts
        .filter(ep => p.id === ep.id)[0].quantity < p.quantity)

    if (findProductsWithNoQuantityAvailable.length) {
      throw new AppError(`The quantity ${findProductsWithNoQuantityAvailable[0].quantity} is not available for product ${findProductsWithNoQuantityAvailable[0].id}`)
    }

    const serializedProducts = products.map(p => ({
      product_id: p.id,
      quantity: p.quantity,
      price: existentProducts.filter(ep => ep.id === p.id)[0].price
    }))

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: serializedProducts
    })

    const { order_products } = order
    const orderedProductsQuantity = order_products.map(p => ({
      id: p.product_id,
      quantity: existentProducts.filter(ep => ep.id === p.product_id)[0].quantity - p.quantity
    }))

    await this.productsRepository.updateQuantity(orderedProductsQuantity)

    return order
  }
}

export default CreateOrderService;
