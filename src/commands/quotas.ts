import fs from "fs";
import { fromIni } from "@aws-sdk/credential-providers";
import type { Arguments, CommandBuilder } from "yargs";
import {
  ServiceQuotasClient,
  ListServicesCommandInput,
  ListServicesCommand,
  ListServiceQuotasCommand,
  ListServiceQuotasCommandInput,
  ListAWSDefaultServiceQuotasCommand,
  ListAWSDefaultServiceQuotasCommandInput,
  RequestServiceQuotaIncreaseCommand,
  RequestServiceQuotaIncreaseCommandInput,
} from "@aws-sdk/client-service-quotas";
import { paginate } from "../utils/sdk";
type Options = {
  name: string;
  upper: boolean | undefined;
};

export const command: string = "quotas <action>";
export const desc: string = "quotas <action> with Hello";

class QuotasService {
  private client: ServiceQuotasClient;
  public static message =
  "This account has reached the maximum number of open service quota increase (SQI) requests. Before opening another SQI request, wait for an open SQI request to be accepted or rejected.";

  constructor({ region, credentials }) {
    this.client = new ServiceQuotasClient({
      region: region as string,
      credentials,
    });
  }

  async listServices() {
    const services = await paginate((nextToken) => {
      const params: ListServicesCommandInput = {
        MaxResults: 100,
      };
      if (nextToken) params.NextToken = nextToken;
      const command = new ListServicesCommand(params);
      return this.client.send(command);
    }, "Services");

    return services;
  }

  async listServiceQuotas(params: ListServiceQuotasCommandInput) {
    const quotasServices = await paginate((nextToken) => {
      if (nextToken) params.NextToken = nextToken;
      const command = new ListServiceQuotasCommand(params);
      return this.client.send(command);
    }, "Quotas");

    return quotasServices;
  }

  async listAWSDefaultServiceQuotas(
    params?: ListAWSDefaultServiceQuotasCommandInput
  ) {
    const quotasServicesDefault = await paginate((nextToken) => {
      if (nextToken) params.NextToken = nextToken;
      const command = new ListAWSDefaultServiceQuotasCommand(params);
      return this.client.send(command);
    }, "Quotas");

    return quotasServicesDefault;
  }

  async requestServiceQuotaIncrease(
    params: RequestServiceQuotaIncreaseCommandInput
  ) {
    const command = new RequestServiceQuotaIncreaseCommand(params);
    await this.client.send(command);
  }
}

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .options({
      region: { type: "string", default: "us-east-1" },
      profile: { type: "string", default: "default" },
      fileName: { type: "string" },
    })
    .positional("action", { type: "string", demandOption: true });

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { action, region, profile, fileName } = argv;
  const quotasService = new QuotasService({
    region,
    credentials: fromIni({
      profile: profile as string,
    }),
  });

  switch (action) {
    case "import":
      const services = await quotasService.listServices();
      const serviceQuotas = [];
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        const currentQuotas = await quotasService.listServiceQuotas({
          MaxResults: 100,
          ServiceCode: service.ServiceCode,
        });
        const defaultQuotas = await quotasService.listAWSDefaultServiceQuotas({
          MaxResults: 100,
          ServiceCode: service.ServiceCode,
        });
        currentQuotas.forEach((quota) => {
          const defaultQuota = defaultQuotas.find(
            (q) => q.QuotaCode === quota.QuotaCode
          );
          if (defaultQuota.Value != quota.Value) {
            serviceQuotas.push(quota);
          }
        });
      }
      fs.writeFileSync(fileName as string, JSON.stringify(serviceQuotas,null, 2));
      break;
      case "restore":
        const quotas = JSON.parse(fs.readFileSync(fileName as string, 'utf-8'))
        for (let i = 0; i < quotas.length; i++) {
            const quota = quotas[i];
            try {
                await quotasService.requestServiceQuotaIncrease({
                    DesiredValue: quota.Value,
                    QuotaCode: quota.QuotaCode,
                    ServiceCode: quota.ServiceCode,
                  }); 
            } catch (error) {
                console.error(error.message);
                if(error.message == QuotasService.message) throw new Error(error.message);
            }
          
        }
        break;
  }
  
  process.exit(0);
};
