import { GraphClientAuthProvider } from "./Authentication";
import { validateGUID } from "./Utility";
import { Client, ClientOptions, PageCollection, PageIterator } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import type { ScopeTagUpdate } from "./Utility";
import type * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import type * as MicrosoftGraphBeta from "@microsoft/microsoft-graph-types-beta";
import type { ChainedTokenCredential } from "@azure/identity"

// Define the Graph Client class.
export class MSGraphClient {
    private client: Promise<Client>;

    // Define the initialization of the class
    constructor(credential: Promise<ChainedTokenCredential>) {
        // Create an instance of the graph client and expose it internally.
        // The credentials are passed as a parameter as to not expose them to other methods internal to this class.
        this.client = this.init(credential);
    }

    // Define the login command that returns a connected instance of the Graph client
    private async init(credential: Promise<ChainedTokenCredential>): Promise<Client> {
        // Instantiate the access token interpreter
        const graphAuthProvider = new GraphClientAuthProvider(await credential);

        // Configure teh initialization system to use the custom graph auth provider
        const clientOptions: ClientOptions = {
            // Configure the auth provider property to be the value of the graph auth constant
            authProvider: graphAuthProvider
        };

        // Connect the graph client to the graph
        return Client.initWithMiddleware(clientOptions);
    };

    // make a page iterator so that pages of data will automatically be all of the data
    private async iteratePage(graphResponse: PageCollection): Promise<any[]> {
        try {
            // Initialize the collection that will be returned after iteration.
            let collection: Array<any> = [];
            
            // Initialize the iterator to use the existing graph connection and the current response that may need iterated on.
            const pageIterator = new PageIterator(await this.client, graphResponse, (data) => {
                // Add data gathered from the iterator to the collection
                collection.push(data);

                // Continue iteration (true means continue, false means pause iteration).
                return true;
            });

            // Start the iteration process and wait for completion of the operation.
            await pageIterator.iterate();

            // Return the collection to the caller
            return collection;
        } catch (error) {
            // if there is an error, tell us about it...
            throw new Error("Page iterator breakdown :(");
        };
    };

    // Return the instance of the specified scope tag
    async getEndpointScopeTag(ID?: number): Promise<MicrosoftGraphBeta.RoleScopeTag[]> {
        if (typeof ID === "undefined") {
            // Retrieve a list of Scope Tags from Endpoint Manager
            const tagListPage: PageCollection = await (await this.client).api("/deviceManagement/roleScopeTags").version("beta").get();

            // Extract the values from the returned list and type it for easier processing
            const tagList: MicrosoftGraphBeta.RoleScopeTag[] = await this.iteratePage(tagListPage);

            // Return the processed data
            return tagList;
        } else {
            if (typeof ID === "number") {
                // Retrieve the specified Scope Tag from Endpoint Manager
                const tagPage: MicrosoftGraphBeta.RoleScopeTag = await (await this.client).api("/deviceManagement/roleScopeTags/" + ID).version("beta").get();

                // Convert the result to an array for type consistency.
                const tagPageList = [tagPage];

                // Return the processed data
                return tagPageList;
            } else {
                throw new Error("The ID that has been passed is not a number! Only numbers should be passed!");
            }
        }
    }

    // Todo: build the scope tag creation system
    async newEndpointScopeTag(scopeTagName: String, description?: String) {
        // Ensure there is less than 1024 characters in the nameDesc
        if (typeof description !== "undefined" && description.length) {
            throw new Error("You cannot have more than 1024 characters in the description!")
        }
    }

    // Todo: build the scope tag update system
    async updateEndpointScopeTag(id: number, nameDesc: ScopeTagUpdate) {
        // Ensure that the method is not being abused by sending nothing in with the update object
        if (typeof nameDesc.name === "undefined" && typeof nameDesc.description === "undefined") {throw new Error("You cannot send an object that does not contain a name or description!")}
        
        // Ensure there is less than 1024 characters in the nameDesc
        if (typeof nameDesc.description !== "undefined" && nameDesc.description.length) {
            throw new Error("You cannot have more than 1024 characters in the description!")
        }
    }

    // Retrieve Microsoft Endpoint Manager configuration profile list. Can pull individual profile based upon GUID
    async getDeviceConfig(GUID?: String): Promise<MicrosoftGraphBeta.GroupPolicyConfiguration[]> {
        if (typeof GUID === "undefined") {
            // Retrieve a list of device configurations from Endpoint Manager
            const deviceConfigPage: PageCollection = await (await this.client).api("/deviceManagement/deviceConfigurations").version("beta").get();

            // Process the page collection to its base form (DeviceConfiguration)
            const deviceConfigList: MicrosoftGraphBeta.DeviceConfiguration[] = await this.iteratePage(deviceConfigPage);

            // Return the processed data
            return deviceConfigList;
        } else {
            // Validate user input to ensure they don't slip us a mickey
            if (validateGUID(GUID)) {
                // Retrieve the specified device configurations from Endpoint Manager
                const deviceConfigPage: MicrosoftGraphBeta.DeviceConfiguration = await (await this.client).api("/deviceManagement/deviceConfigurations/" + GUID).version("beta").get();

                // Convert the result to an array for type consistency.
                const deviceConfigList = [deviceConfigPage];

                // Return the processed data
                return deviceConfigList;
            } else {
                // Notify the caller that the GUID isn't right if GUID validation fails.
                throw new Error("The parameter specified is not a valid GUID!");
            };
        }
    }

    // Retrieve Microsoft Endpoint Manager Group Policy configuration list. Can pull individual policy based upon GUID
    async getDeviceGroupPolicyConfig(GUID?: String): Promise<MicrosoftGraphBeta.GroupPolicyConfiguration[]> {
        if (typeof GUID === "undefined") {
            // Retrieve the specified device configurations from Endpoint Manager
            const deviceGroupPolicyPage: PageCollection = await (await this.client).api("/deviceManagement/groupPolicyConfigurations/").version("beta").get();
            
            // Process the page collection to its base form (DeviceConfiguration)
            const deviceGroupPolicyList: MicrosoftGraphBeta.GroupPolicyConfiguration[] = await this.iteratePage(deviceGroupPolicyPage);

            // Return the processed data
            return deviceGroupPolicyList;
        } else {
            // Validate user input to ensure they don't slip us a mickey
            if (validateGUID(GUID)) {
                // Retrieve the specified device configurations from Endpoint Manager
                const deviceGroupPolicyPage: MicrosoftGraphBeta.GroupPolicyConfiguration = await (await this.client).api("/deviceManagement/groupPolicyConfigurations/" + GUID).version("beta").get();
                
                // Convert the result to an array for type consistency.
                const deviceGroupPolicyList = [deviceGroupPolicyPage];

                // Return the processed data
                return deviceGroupPolicyList;
            } else {
                // Notify the caller that the GUID isn't right if GUID validation fails.
                throw new Error("The parameter specified is not a valid GUID!");
            };
        } 
    }

    // Todo: write the code that builds a new login restriction configuration
    async newInteractiveLoginConfiguration() { }

    // Todo: Write the code that updates existing login restriction configurations
    async updateInteractiveLoginConfiguration() { }

    // Todo: Write the code that removes login restriction configurations
    async removeInteractiveLoginConfiguration() { }

    async getAADUserList() { }
    async getAADGroupList() { }
    async newAADGroup() { }
}