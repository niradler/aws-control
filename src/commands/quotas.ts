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

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .options({
            region: { type: "string", default: "us-east-1" },
        })
        .positional("action", { type: "string", demandOption: true });

export const handler = async (argv: Arguments<Options>): Promise<void> => {
    const { action, region } = argv;

    const client = new ServiceQuotasClient({ region: region as string });

    switch (action) {
        case "list-services":
            const services = await paginate((nextToken) => {
                const params: ListServicesCommandInput = {
                    MaxResults: 100,
                };
                if (nextToken) params.NextToken = nextToken;
                const command = new ListServicesCommand(params);
                return client.send(command);
            }, "Services");

            console.log(services);
            break;
        case "list-quotas":
            const quotasServices = await paginate((nextToken) => {
                const params: ListServiceQuotasCommandInput = {
                    ServiceCode: "AWS.EC2",
                };
                if (nextToken) params.NextToken = nextToken;
                const command = new ListServiceQuotasCommand(params);
                return client.send(command);
            }, "Quotas");

            console.log(quotasServices);
            break;
        case "list-quotas-default":
            const quotasServicesDefault = await paginate((nextToken) => {
                const params: ListAWSDefaultServiceQuotasCommandInput = {
                    ServiceCode: "AWS.EC2",
                };
                if (nextToken) params.NextToken = nextToken;
                const command = new ListAWSDefaultServiceQuotasCommand(params);
                return client.send(command);
            }, "Quotas");

            console.log(quotasServicesDefault);
            break;
        case "request-quotas":
            const params: RequestServiceQuotaIncreaseCommandInput = {
                DesiredValue: 1,
                QuotaCode: "AWS.EC2.VPC.MAXIMUM_VPCS",
                ServiceCode: "AWS.EC2",
            };
            const command = new RequestServiceQuotaIncreaseCommand(params);
            await client.send(command);
            break;
    }

    process.stdout.write("");
    process.exit(0);
};
