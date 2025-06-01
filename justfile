_default:
    just --list

[doc('start the MCP inspector')]
[group('inspector')]
inspect:
    npx @modelcontextprotocol/inspector -e QDRANT_URL='http://localhost:6335' node {{ justfile_directory() }}dist/mcp-server.js 

[doc('kill the inspector process')]
[group('inspector')]
kill-inspector:
    pkill -f "inspector"

[doc('Open the MCP inspector in a browser')]
[group('inspector')]
open-inspector:
    open http://localhost:6274

[doc('format the justfile(s)')]
[group('utils')]
fmt:
    @just --fmt --unstable -f justfile
