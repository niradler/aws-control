import fs from "fs";
import { fromIni } from "@aws-sdk/credential-providers";
import type { Arguments, CommandBuilder } from "yargs";
import { toAbsPath, consoleOutput } from "../utils/helpers";
import QuotasService from "../services/QuotasService";

type Options = {
    name: string;
    upper: boolean | undefined;
};

export const command: string = "quotas <action>";
export const desc: string = "Manage AWS service quotas";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .options({
            fileName: { type: "string" },
        })
        .positional("action", { type: "string", demandOption: true });

export const handler = async (argv: Arguments<Options>): Promise<void> => {
    const { action, region, profile, fileName, output } = argv;
    const quotasService = new QuotasService({
        region,
        credentials: fromIni({
            profile: profile as string,
        }),
    });
    let services;
    switch (action) {
        case "list-requests":
            services = await quotasService.listRequestedServiceQuota();
            consoleOutput(services, output);
            break;
        case "list-services":
            services = await quotasService.listServices();
            consoleOutput(services, output);
            break;
        case "import":
            services = await quotasService.listServices();
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
            fs.writeFileSync(toAbsPath(fileName), JSON.stringify(serviceQuotas, null, 2));
            break;
        case "restore":
            const quotas = JSON.parse(fs.readFileSync(toAbsPath(fileName), 'utf-8'))
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
                    if (error.message == QuotasService.message) throw new Error(error.message);
                }

            }
            break;
        default:
            console.error(`Action ${action} not found`);
    }

    process.exit(0);
};
