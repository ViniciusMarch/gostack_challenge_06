import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse'
import path from 'path';
import fs from 'fs';

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
    const transactions: ITransactionParsed[] = [];
    const categories: string[] = [];
    const lines: string[] = [];

    // const parsedData: ITransactionParsed[] =

    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({from_line: 2, ltrim: true, rtrim: true})

    const parseCsv = readCSVStream.pipe(parseStream);

    parseCsv.on('data', (line) => {
      const [title, type, value, category] = line.map((cell: string) => cell);

      if(!title || !type || !value) return;

      transactions.push({ title, type, value, category });

      categories.push(category);
    });

    await new Promise(resolve => {
      parseCsv.on('end', resolve);
    });

    const foundCategories = await categoriesRepository.find({ where: { title: In(categories) } });

    const foundCategoriesTitles = foundCategories.map(category => category.title);

    const newCategoriesTitles = categories
      .filter(category => !foundCategoriesTitles.includes(category))
      .filter((value, index, array) =>  // Incluir no documento // { return x } === x
        array.indexOf(value) === index
    );

    const newCategories = categoriesRepository.create(newCategoriesTitles.map(title => ( { title } )));

    await categoriesRepository.save(newCategories);

    const categoriesConcated = foundCategories.concat(newCategories);

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => {
        const { title, type, value } = transaction;
        return {
          title,
          type,
          value,
          category: categoriesConcated.find(category => category.title === transaction.category)}
    }));

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
