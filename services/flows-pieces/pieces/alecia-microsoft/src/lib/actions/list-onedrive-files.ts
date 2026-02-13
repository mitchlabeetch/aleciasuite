import { createAction, Property } from "@activepieces/pieces-framework";
import { Client } from "@microsoft/microsoft-graph-client";

export const listOneDriveFiles = createAction({
  name: "list_onedrive_files",
  displayName: "List OneDrive Files",
  description: "Browse files in OneDrive",
  props: {
    path: Property.ShortText({
      displayName: "Path",
      required: false,
      defaultValue: "/",
      description: "Folder path (default: root)",
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const path = context.propsValue.path || "/";

    let endpoint;
    if (path === "/") {
      endpoint = "/me/drive/root/children";
    } else {
      endpoint = `/me/drive/root:${path}:/children`;
    }

    const result = await client.api(endpoint).get();

    return result;
  },
});
