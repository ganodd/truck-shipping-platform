import { Global, Module } from '@nestjs/common';

import { loadConfig } from '@truck-shipping/shared-utils';

export const CONFIG_TOKEN = 'APP_CONFIG';

@Global()
@Module({
  providers: [
    {
      provide: CONFIG_TOKEN,
      useFactory: () => loadConfig(),
    },
  ],
  exports: [CONFIG_TOKEN],
})
export class ConfigModule {}
