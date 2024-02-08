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
                this.setState({
                    buttonText: SDK.getConfiguration().witInputs["ButtonTitle"]
                })
                SDK.resize();
            }
        )
    }

    private registerEvents() {
        SDK.register(SDK.getContributionId(), () => {
          return {
            // Called when the active work item is modified
            onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
              this.setState({
                eventContent: `onFieldChanged - ${JSON.stringify(args)}`
              });
            },
    
            // Called when a new work item is being loaded in the UI
            onLoaded: (args: IWorkItemLoadedArgs) => {
              this.setState({
                eventContent: `onLoaded - ${JSON.stringify(args)}`
              });
            },
    
            // Called when the active work item is being unloaded in the UI
            onUnloaded: (args: IWorkItemChangedArgs) => {
              this.setState({
                eventContent: `onUnloaded - ${JSON.stringify(args)}`
              });
            },
    
            // Called after the work item has been saved
            onSaved: (args: IWorkItemChangedArgs) => {
              this.setState({
                eventContent: `onSaved - ${JSON.stringify(args)}`
              });
            },
    
            // Called when the work item is reset to its unmodified state (undo)
            onReset: (args: IWorkItemChangedArgs) => {
              this.setState({
                eventContent: `onReset - ${JSON.stringify(args)}`
              });
            },
    
            // Called when the work item has been refreshed from the server
            onRefreshed: (args: IWorkItemChangedArgs) => {
              this.setState({
                eventContent: `onRefreshed - ${JSON.stringify(args)}`
              });
            }
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
                <div className="sample-work-item-events">{this.state.eventContent}</div>
            </div>
        )
    }

    private async onClick() {
        const fields : Array<string> = SDK.getConfiguration().witInputs["SourceFields"].split(",");
        const endpoint: string = SDK.getConfiguration().witInputs["AzureTranslatorApiEndpoint"];

        const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
        
        workItemFormService.setFieldValue(
          "System.Title",
          "Title set from your group extension!"
        );
      }
}

export default TranslateButton;

showRootComponent(<TranslateButton />);