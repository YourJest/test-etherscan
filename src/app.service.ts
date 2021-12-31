import { Injectable } from '@nestjs/common';
import { getTransactions, getHighestValue, getWallets } from './etherscan';

@Injectable()
export class AppService {
  findWallets(): any[] {
    return getWallets();
  }
  findHighest() : any[]{
    return getHighestValue()
  }
  findTransactions() : any[] {
    return getTransactions()
  }
}
