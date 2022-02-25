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
    ListRequestedServiceQuotaChangeHistoryCommand,
    ListRequestedServiceQuotaChangeHistoryCommandInput,
} from "@aws-sdk/client-service-quotas";
import { paginate } from "../utils/sdk";

export default class QuotasService {
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

    async listRequestedServiceQuota(params: ListRequestedServiceQuotaChangeHistoryCommandInput = {}) {
        const quotasRequests = await paginate((nextToken) => {
            if (nextToken) params.NextToken = nextToken;
            const command = new ListRequestedServiceQuotaChangeHistoryCommand(params);
            return this.client.send(command);
        }, "RequestedQuotas");

        return quotasRequests;
    }
}