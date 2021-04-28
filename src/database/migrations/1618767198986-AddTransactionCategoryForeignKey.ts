import {MigrationInterface, QueryRunner, TableForeignKey} from "typeorm";

export default class AddTransactionCategoryForeignKey1618767198986 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.createForeignKey('transactions', new TableForeignKey({
        name: 'TransactionCategory',
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropForeignKey('transactions', 'TransactionCategory');
    }

}
