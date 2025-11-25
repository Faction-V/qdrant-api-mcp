"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpErrorCode = void 0;
/**
 * MCP error codes
 */
var McpErrorCode;
(function (McpErrorCode) {
    McpErrorCode[McpErrorCode["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    McpErrorCode[McpErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    McpErrorCode[McpErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    McpErrorCode[McpErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    McpErrorCode[McpErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    McpErrorCode[McpErrorCode["SERVER_ERROR_START"] = -32000] = "SERVER_ERROR_START";
    McpErrorCode[McpErrorCode["SERVER_ERROR_END"] = -32099] = "SERVER_ERROR_END";
    McpErrorCode[McpErrorCode["QDRANT_ERROR"] = -32050] = "QDRANT_ERROR";
})(McpErrorCode || (exports.McpErrorCode = McpErrorCode = {}));
//# sourceMappingURL=mcp.js.map