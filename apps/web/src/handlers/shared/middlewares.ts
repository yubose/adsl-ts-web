import * as u from "@jsmanifest/utils";
import type { ConsumerOptions, NDOMPage } from "noodl-ui";
import { isAction } from "noodl-action-chain";
import { createAction } from "noodl-ui";
import log from "loglevel";
import { ActionHandlerArgs, MiddlewareFn } from "../../factories/actionFactory";
import App from "../../App";
import { useGotoSpinner } from "./goto";
import { ActionEvent } from "../../constants";
import type { AppStateActionEvent } from "../../app/types";

/**
 * This file contains middleware functions wrapping functions from
 * src/actions.ts and src/builtIns.ts
 */
function getMiddlewares() {
	/**
	 * Transforms abnormal args to the expected [action, options] structure
	 * Useful to handle dynamically injected actions (goto strings for
	 * destinations for example)
	 */
	const handleInjections: MiddlewareFn = (args, { app }) => {
		const originalArgs = [...args];
		// Dynamically injected goto destination from lvl 3
		if (u.isStr(args[0])) {
			const prevArgs = [...args];
			// Create missing options
			if (!prevArgs[1]) {
				args[1] = app.nui.getConsumerOptions({
					page: app.mainPage.getNuiPage(),
				});
			}
			// Dynamically injected goto object from lvl 3.
			// Convert to a noodl-ui Action
			args[0] = createAction({
				action: { actionType: "goto", goto: args[0] },
				trigger: "onClick",
			});
		}

		// Dynamically injected goto object from lvl 3
		else if (u.isObj(args[0]) && !isAction(args[0])) {
			if ("destination" in args[0] || "goto" in args[0]) {
				// Convert to a noodl-ui Action
				args[0] = createAction({
					action: {
						actionType: "goto",
						goto: args[0]?.["destination"] || args[0]?.goto,
					},
					trigger: "onClick",
				});
			}
		}

		if (!args[1]) {
			// Create options argument if missing
			args[1] = app.nui.getConsumerOptions({
				page: app.mainPage.getNuiPage(),
			});
		}

		// TODO - Where is "pageName" coming from?
		if (u.isObj(originalArgs[0]) && "pageName" in originalArgs[0]) {
			const currentPage = originalArgs[0].pageName || "";
			if (args[1]?.page && args[1].page.page !== currentPage) {
				// Replace the NDOM page with a matching NDOM page
				try {
					args[1].page = app.ndom.findPage(currentPage);
				} catch (error) {}
			}
		}
	};

	/**
	 * TODO - Continue implementation
	 * @param args
	 * @param param1
	 */
	const actionsEventState: MiddlewareFn = (args, { app }) => {
		console.log(`[actionsEventState]`, {
			action: args?.[0],
			options: args?.[1],
		});

		if (u.isArr(args)) {
			if (isAction(args[0])) {
				const type = args[0]?.actionType;

				if (u.isStr(type)) {
					if (type === "goto") {
						const actionEvent: AppStateActionEvent = {
							type: "action",
							kind: ActionEvent.Goto,
							status: "ready",
							timestamp: Date.now(),
						};
						app.getState().actionEvents.push(actionEvent);
					} else {
						//
					}
				}
			}
		}

		if (app.getState().actionEvents.length > 50) {
			while (app.getState().actionEvents.length > 50) {
				const actionEvents = app.getState().actionEvents;
				log.debug(
					`Removing ${actionEvents[0].type} from action events`,
					actionEvents[0]
				);
				actionEvents.shift();
			}
		}
	};

	const preventAnotherGotoWhenCurrentlyNavigating: MiddlewareFn = (
		args,
		{ app }
	) => {
		const action = args?.[0];

		if (isAction(action)) {
			const options = args?.[1] as ConsumerOptions;

			if (options?.page) {
				const page = app.ndom.findPage(options?.page) as NDOMPage;

				if (page) {
					const pendingPage = page.requesting;
					const currentPage = page.page;
					let newPageRequesting = "";

					if (u.isStr(action.original?.goto)) {
						newPageRequesting = action.original?.goto;
					} else if (u.isObj(action.original?.goto)) {
						if (u.isStr(action.original?.goto.destination)) {
							newPageRequesting = action.original?.goto.destination;
						}
					}

					if (pendingPage && currentPage && newPageRequesting) {
						if (pendingPage !== currentPage) {
							if (pendingPage !== newPageRequesting) {
								// This block is reached when the user clicks several buttons too fast and it tries to navigate to all of the pages in the onClicks.
								// Prevent the goto
								log.error(
									`Preventing another goto because there is another one already in process`
								);
								return "abort";
								// debugger
							}
						}
					}
				}
			}
			// }
		}
	};

	return {
		handleInjections,
		actionsEventState,
		preventAnotherGotoWhenCurrentlyNavigating,
	};
}

export default getMiddlewares;
