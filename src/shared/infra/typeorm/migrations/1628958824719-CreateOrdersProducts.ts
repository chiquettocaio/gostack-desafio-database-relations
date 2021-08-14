import {MigrationInterface, QueryRunner, Table} from "typeorm";

export default class CreateOrdersProducts1628958824719 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders_products',
        columns: [{
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()'
        }, {
          name: 'price',
          type: 'decimal',
          precision: 10, // 10 números antes da vírgula
          scale: 2 // 2 números após a vírgula
        }, {
          name: 'quantity',
          type: 'int'
        }, {
          name: 'created_at',
          type: 'timestamp',
          default: 'now()'
        }, {
          name: 'updated_at',
          type: 'timestamp',
          default: 'now()'
        }]
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orders_products')
  }
}
