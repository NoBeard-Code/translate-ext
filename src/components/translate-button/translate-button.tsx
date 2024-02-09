import {
    IWorkItemFormService,
    WorkItemTrackingServiceIds,
    WorkItemOptions
  } from "azure-devops-extension-api/WorkItemTracking";
import React, { Component } from "react";
import * as SDK from "azure-devops-extension-sdk";
import "./translate-button.scss";
import { Button } from "azure-devops-ui/Button";
import { showRootComponent } from "../../common";

interface TranslateButtonComponentState {
    buttonText: string;
    statusText: string;
    statusColor: string;
  }

export class TranslateButton extends Component<{}, TranslateButtonComponentState> {

    constructor(props: {}) {
        super(props);
        this.state = {
            buttonText: "Default text",
            statusText: "Ready.",
            statusColor: ""
        };
      }

    public componentDidMount() {
        SDK.init().then(() => {
            this.registerEvents();
        })

        SDK.ready().then(
            () => {
                SDK.notifyLoadSucceeded();
                this.setState({
                    buttonText: SDK.getConfiguration().witInputs["ButtonTitle"]
                });
                SDK.resize();
            }
        )
    }

    private registerEvents() {
        SDK.register(SDK.getContributionId(), () => {
          return {
          };
        });
      }

    public render(): JSX.Element {
        return (
            <div className='buttonContainer'>
                <Button
                    text={this.state.buttonText}
                    onClick={() => this.onClick()}
                    className="button"
                />
                <pre className="resultbox depth-4 padding-4 font-size-xs custom-scrollbar">
                    {this.state.statusText}
                </pre>
            </div>
        )
    }

    private async onClick() {

        this.setState({
            statusText: "Initializing ...",
            statusColor: ""
        });

        // source & destination fields parameters
        const sourceFields : Array<string> = SDK.getConfiguration().witInputs["SourceFields"].split(",");
        const destFields : Array<string> = SDK.getConfiguration().witInputs["DestinationFields"].split(",");

        if (sourceFields === null || sourceFields.length === 0 || destFields === null || destFields.length === 0) {
            this.setState({
                statusText: "Source and/or destination fields parameters are not defined.",
                statusColor: "#e81123"
            });
            throw new Error(this.state.statusText);
        }
        else if (sourceFields.length != destFields.length) {
            this.setState({
                statusText: "Number of provided source and destination fields does not match.",
                statusColor: "#e81123"
            });
            throw new Error(this.state.statusText);
        }

        // Azure Translator API parameters
        const secretKey: string = SDK.getConfiguration().witInputs["AzureTranslatorApiKey"];
        const region: string = SDK.getConfiguration().witInputs["AzureTranslatorApiRegion"];
        
        if (secretKey === null || secretKey === "" || region === null || region === "") {
            this.setState({
                statusText: "Azure Translator API parameters are not defined.",
                statusColor: "#e81123"
            });
            throw new Error(this.state.statusText);
        }

        // language parameters
        const sourceLanguage: string = SDK.getConfiguration().witInputs["SourceLanguage"];
        const targetLanguage: string = SDK.getConfiguration().witInputs["TargetLanguage"];

        if (sourceLanguage === null || sourceLanguage === "" || targetLanguage === null || targetLanguage === "") {
            this.setState({
                statusText: "Language parameters are not defined.",
                statusColor: "#e81123"
            });
            throw new Error(this.state.statusText);
        }

        // Azure DevOps SDK service calls
        const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
        
        let translationCalls = new Array<Promise<any>>();
        const options = new Options().returnOriginalValue = false;

        for (let i = 0; i < sourceFields.length; i++) {
            const fieldValue = await workItemFormService.getFieldValue(sourceFields[i], options);
            translationCalls.push(this.translateText(secretKey, region, sourceLanguage, targetLanguage, fieldValue as string));
        }
        
        this.setState({
            statusText: "Sending requests ...",
            statusColor: "#55a362"
        });

        await Promise.all(translationCalls).then(async (values) => {
            if (values.length != destFields.length) {
                throw new Error("API number of results does not match number of destination fields.");
            }
            for (let i = 0; i < values.length; i++) {
                const translation = values[i][0].translations[0].text;
                await workItemFormService.setFieldValue(destFields[i], translation);
            }

            this.setState({
                statusText: "Done.",
                statusColor: ""
            });
        });
      }

      private async translateText(secretKey: string, region: string, sourceLang: string, destLang: string, text: string) {

        const result = await fetch('https://api.cognitive.microsofttranslator.com/translate?' + new URLSearchParams({
                'api-version': '3.0',
                'from': sourceLang,
                'to': destLang,
                'scope': 'translation'
            }), { 
            method: 'POST',
            headers: {
                'Content-Type':'application/json',
                'Ocp-Apim-Subscription-Key': secretKey,
                'Ocp-Apim-Subscription-Region': region
            },
            body: JSON.stringify(
                [
                    {'Text': text }
                ]
            )
        })
        .then((response) => response.json())
        .then((responseJson) => {
          return responseJson;
        })
        .catch((error) => {
            this.setState({
                statusText: `Error executing API request: ${ error }`,
                statusColor: "#e81123"
            });
            throw new Error(this.state.statusText);
        });

        return result;
      }
}

class Options implements WorkItemOptions { returnOriginalValue: boolean = true }

export default TranslateButton;

showRootComponent(<TranslateButton />);