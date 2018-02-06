// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "text/x-dockerfile");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("simple_nodejs_dockerfile",
     "[keyword FROM] node:carbon",
     "[comment # Create app directory]",
     "[keyword WORKDIR] /usr/src/app",
     "[comment # Install app dependencies]",
     "[comment # A wildcard is used to ensure both package.json AND package-lock.json are copied]",
     "[comment # where available (npm@5+)]",
     "[keyword COPY] package*.json ./",
     "[keyword RUN] npm install",
     "[keyword COPY] . .",
     "[keyword EXPOSE] 8080 3000",
     "[keyword ENV] NODE_ENV development",
     "[keyword CMD] [[\"npm\", \"start\"]]");

  // Ideally the last space should not be highlighted.
  MT("instruction_without_args_1",
     "[keyword CMD ]");

  MT("instruction_without_args_2",
     "[comment # An instruction without args...]",
     "[keyword ARG] [error #...is an error]");

  MT("multiline",
     "[keyword RUN] apt-get update && apt-get install -y \\",
     "  mercurial \\",
     "  subversion \\",
     "  && apt-get clean \\",
     "  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*");

  MT("from_comment",
     "  [keyword FROM] debian:stretch [comment # I tend to use stable as that is more stable]",
     "  [keyword FROM] debian:stretch [keyword AS] stable [comment # I am even more stable]",
     " [keyword FROM] [error # this is an error]");

  MT("from_as",
     "[keyword FROM] golang:1.9.2-alpine3.6 [keyword AS] build",
     "[keyword COPY] --from=build /bin/project /bin/project",
     "[keyword ENTRYPOINT] [[\"/bin/project\"]]",
     "[keyword CMD] [[\"--help\"]]");

  MT("arg",
     "[keyword ARG] VERSION=latest",
     "[keyword FROM] busybox:$VERSION",
     "[keyword ARG] VERSION",
     "[keyword RUN] echo $VERSION > image_version");

  MT("label",
     "[keyword LABEL] com.example.label-with-value=\"foo\"",
     "[keyword LABEL] description=\"This text illustrates \"",
     "  that label-values can span multiple lines.\"");

  MT("maintainer",
     "[keyword MAINTAINER] Foo Bar \"foo@bar.com\"",
     "[keyword MAINTAINER] Bar Baz <bar@baz.com>");

  MT("verify_keyword",
     "[keyword RUN] add-apt-repository ppa:chris-lea/node.js");

  MT("scripts",
     "[comment # Set an entrypoint, to automatically install node modules]",
     "[keyword ENTRYPOINT] [[\"/bin/bash\", \"-c\", \"if [[ ! -d node_modules ]]; then npm install; fi; exec \\\"${@:0}\\\";\"]]",
     "[keyword CMD] npm start",
     "[keyword RUN] npm run build && npm run test");
})();
