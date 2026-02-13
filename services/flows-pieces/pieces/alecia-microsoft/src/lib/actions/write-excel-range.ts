import { createAction, Property } from "@activepieces/pieces-framework";
import { Client } from "@microsoft/microsoft-graph-client";

export const writeExcelRange = createAction({
  name: "write_excel_range",
  displayName: "Write Excel Range",
  description: "Write data to an Excel file on OneDrive",
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
    values: Property.LongText({
      displayName: "Values",
      required: true,
      description: "JSON 2D array (e.g., [[1,2],[3,4]])",
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const parsedValues = JSON.parse(context.propsValue.values);

    const result = await client
      .api(`/me/drive/items/${context.propsValue.fileId}/workbook/worksheets/${context.propsValue.sheetName}/range(address='${context.propsValue.range}')`)
      .patch({ values: parsedValues });

    return result;
  },
});
