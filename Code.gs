const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"; // ضع هنا الـ ID الخاص بالـ Google Sheet
const SHEET_NAME = "Orders"; // ضع هنا اسم الورقة إذا لم تكن الورقة الأولى

function doOptions(e) {
  return makeOutput({ status: "ok" });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Missing request body");
    }

    const data = JSON.parse(e.postData.contents);
    const orderId = String(data.orderId || "").trim();
    if (!orderId) {
      throw new Error("orderId is required");
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("items must be a non-empty array");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    if (!sheet) {
      throw new Error("Sheet not found");
    }

    if (orderExists(sheet, orderId)) {
      return makeOutput({
        status: "duplicate",
        message: "Order ID already exists",
        orderId,
      });
    }

    const timestamp = new Date();
    const rowsToAppend = data.items.map(function (item) {
      return [
        orderId,
        timestamp,
        data.customerName || "غير معروف",
        data.phone || "",
        data.address || "",
        data.email || "",
        item.name || "",
        item.category || "",
        item.price != null ? Number(item.price) : "",
        data.orderDate || new Date().toLocaleString("ar-EG"),
        data.status || "جديد",
      ];
    });

    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rowsToAppend.length,
        rowsToAppend[0].length,
      )
      .setValues(rowsToAppend);

    return makeOutput({
      status: "success",
      message: "Order Saved",
      savedRows: rowsToAppend.length,
    });
  } catch (error) {
    return makeOutput({
      status: "error",
      message: error.message || "Invalid request",
    });
  }
}

function orderExists(sheet, orderId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return false;
  }

  const range = sheet.getRange(2, 1, lastRow - 1, 1);
  return Boolean(
    range.createTextFinder(orderId).matchEntireCell(true).findNext(),
  );
}

function makeOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
}
