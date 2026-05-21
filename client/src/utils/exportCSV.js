export const exportCSV = (
  data,
  fileName = "export.csv"
) => {
  const csvRows = [];

  const headers =
    Object.keys(data[0]);

  csvRows.push(
    headers.join(",")
  );

  for (const row of data) {
    const values = headers.map(
      (header) => row[header]
    );

    csvRows.push(
      values.join(",")
    );
  }

  const blob = new Blob(
    [csvRows.join("\n")],
    {
      type: "text/csv",
    }
  );

  const url =
    window.URL.createObjectURL(
      blob
    );

  const a =
    document.createElement("a");

  a.href = url;

  a.download = fileName;

  a.click();
};