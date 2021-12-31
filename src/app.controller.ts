import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  findHighest() : any[]{
    return this.appService.findHighest();
  }
  @Get('wallets')
  findWallets(): any[] {
    return this.appService.findWallets();
  }
  @Get("transactions")
  findTransactions() : any[] {
    return this.appService.findTransactions();
  }
}
