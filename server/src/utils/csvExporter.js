const {
  Parser,
} = require("json2csv");

const exportToCSV = (
  data
) => {
  const parser =
    new Parser();

  return parser.parse(data);
};

module.exports = {
  exportToCSV,
};