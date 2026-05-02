import { Global, Module } from '@nestjs/common';
import { EntidadesClientService } from './entidades-client.service';

@Global()
@Module({
  providers: [EntidadesClientService],
  exports: [EntidadesClientService],
})
export class EntidadesClientModule {}
