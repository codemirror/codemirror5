"use strict"

let version = process.argv[2]
let auth = process.argv[3]
let url = require("url")

if (!auth) {
  console.log("Usage: upload-release.js [TAG] [github-user:password]")
  process.exit(1)
}

function post(host, path, body) {
  let req = require("https").request({
    host,
    auth: auth,
    headers: {"user-agent": "Release uploader"},
    path,
    method: "POST"
  }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400) {
      console.log(res.headers.location)
      let parsed = url.parse(res.headers.location)
      post(parsed.host, parsed.path, body)
    } else if (res.statusCode >= 400) {
      console.error(res.statusCode, res.statusMessage)
      res.on("data", d => console.log(d.toString()))
      res.on("end", () => process.exit(1))
    }
  })
  req.write(body)
  req.end()
}

require('child_process').exec("git --no-pager show -s --format='%s' " + version, (error, stdout) => {
  if (error) throw error
  let message = stdout.split("\n").slice(2)
  message = message.slice(0, message.indexOf("-----BEGIN PGP SIGNATURE-----")).join("\n")

  post("api.github.com", "/repos/codemirror/codemirror5/releases", JSON.stringify({
    tag_name: version,
    name: version,
    body: message
  }))
})
