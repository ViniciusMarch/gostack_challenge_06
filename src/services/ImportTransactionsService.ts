import path from 'path';
import { getCustomRepository, getRepository } from 'typeorm';
import csv from 'csvtojson';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface ITransactionParsed {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface IRequest {
  fileName: string;
}

class ImportTransactionsService {
  async execute({ fileName }: IRequest): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const filePath = path.join(uploadConfig.directory, fileName);

    const transactions = csv().fromFile(filePath).then(async (transactionsParsed: ITransactionParsed[]) => {
      const promisedTransactions = transactionsParsed.map(async transac => {

        const { title, type, value, category } = transac;

        let category_id: string;

        const categoryExists = await categoriesRepository.findOne({where: {title: category}});

        if(categoryExists) {
          category_id = categoryExists.id;
        }
        else {
          const categoryNeo = categoriesRepository.create({title: category});
          await categoriesRepository.save(categoryNeo);
          category_id = categoryNeo.id;
        }

        const transaction = transactionsRepository.create({ title, type, value, category_id });
        await transactionsRepository.save(transaction);

        return transaction;
      });

      return Promise.all(promisedTransactions);
    });

    return transactions;
  }
}

export default ImportTransactionsService;
