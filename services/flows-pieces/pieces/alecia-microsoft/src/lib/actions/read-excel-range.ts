import { createAction, Property } from "@activepieces/pieces-framework";
import { Client } from "@microsoft/microsoft-graph-client";

export const readExcelRange = createAction({
  name: "read_excel_range",
  displayName: "Read Excel Range",
  description: "Read data from an Excel file on OneDrive",
  props: {
    fileId: Property.ShortText({
      displayName: "File ID",
      required: true,
    }),
    sheetName: Property.ShortText({
      displayName: "Sheet Name",
      required: true,
    }),
    range: Property.ShortText({
      displayName: "Range",
      required: true,
      description: "Excel range (e.g., A1:D10)",
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const result = await client
      .api(`/me/drive/items/${context.propsValue.fileId}/workbook/worksheets/${context.propsValue.sheetName}/range(address='${context.propsValue.range}')`)
      .get();

    return result;
  },
});
