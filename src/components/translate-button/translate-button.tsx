import {
    IWorkItemChangedArgs,
    IWorkItemFieldChangedArgs,
    IWorkItemFormService,
    IWorkItemLoadedArgs,
    WorkItemTrackingServiceIds,
    WorkItemOptions
  } from "azure-devops-extension-api/WorkItemTracking";
import React, { Component } from "react";
import * as SDK from "azure-devops-extension-sdk";
import "./translate-button.scss";
import { Button } from "azure-devops-ui/Button";
import { showRootComponent } from "../../common";

interface TranslateButtonComponentState {
    eventContent: string;
    buttonText: string;
    translatedText: string;
  }

export class TranslateButton extends Component<{},  TranslateButtonComponentState> {

    constructor(props: {}) {
        super(props);
        this.state = {
            eventContent: "",
            buttonText: "Default text",
            translatedText: ""
        };
      }

    public componentDidMount() {
        SDK.init().then(() => {
            this.registerEvents();
        })

        SDK.ready().then(
            () => {
                SDK.notifyLoadSucceeded();
                // this.setState({
                //     buttonText: SDK.getConfiguration().witInputs["ButtonTitle"]
                // });
                // SDK.resize();
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
                    {this.state.translatedText}
                </pre>
            </div>
        )
    }

    private async onClick() {
        const fields : Array<string> = SDK.getConfiguration().witInputs["SourceFields"].split(",");
        const secretKey: string = SDK.getConfiguration().witInputs["AzureTranslatorApiKey"];

        const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
        
        alert("helou!");
        // workItemFormService.setFieldValue(
        //   "System.Title",
        //   "Title set from your group extension!"
        // );
      }
}

export default TranslateButton;

showRootComponent(<TranslateButton />);