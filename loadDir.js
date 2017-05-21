const fs    = require("fs")
    , path  = require("path")

function loadDir(dir) {
  return new Promise((pass, fail) => {
    const acc = {}

    function Barrier(size) {
      this.size = size
      this.hit = function() {
        this.size--
        if(!this.size)
          pass(acc)
      }
    }
    let barrier = new Barrier(1)

    function loadDir(dir, JSON) {
      fs.readdir(dir, (err, files) => {
        barrier.size += files.length
        barrier.hit()

        if(err) console.error("Error on readdir,",err)
        files.forEach((file) => {
          let filePath = path.join(dir, file)

          fs.stat(filePath, (err, stats) => {
            if(err) console.error("Error on stats,", err)
            if(stats.isDirectory()) {
              JSON[file] = {}
              loadDir(path.join(dir, file), JSON[file])
            } else {
              JSON[file.slice(0, -5)] = file
              barrier.hit()
            }
          })
        })
      })
    }

    loadDir(dir, acc)
  })
}

loadDir("./Telemetricor/Bumble/JSQL/tests/res/jsql")
  .then((JSON) => {
    console.log("Finished:", JSON)
  })
  .catch((err) => {
    console.error("Failed to load directory with:", err)
  })
