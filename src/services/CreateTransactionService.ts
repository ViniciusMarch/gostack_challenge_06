import AppError from '../errors/AppError';

import {getCustomRepository, getRepository} from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';
import ICreateTransactionDTO from '../dtos/ICreateTransactionDTO';

interface IRequest extends ICreateTransactionDTO{
  category: string;
}

class CreateTransactionService {
  public async execute({ title, value, type, category }: IRequest): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if(type === 'outcome' && balance.total - value < 0) {
      throw new AppError('O outcome não pode superar o valor total.')
    }

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

    const transaction = transactionsRepository.create({title, value, type, category_id})

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
