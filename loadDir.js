const fs    = require("fs")
    , path  = require("path")

function loadDir(dir, promise) {
  return new Promise((pass, fail) => {
    const acc = {}
    const errors = []
    let barrier = new Barrier(1)

    function Barrier(size) {
      this.size = size
      this.hit = function() {
        this.size--
        if(!this.size) {
          if(!errors.length) {
            pass(acc)
          } else {
            fail("Errors loading directory:\n"+errors.join('\n'))
          }
        }
      }
    }

    function loadDir(dir, JSON) {
      fs.readdir(dir, (err, files) => {
        if(err) {
          errors.push("Error reading directory: "+err)
          barrier.hit()
        } else {
          barrier.size += files.length
          barrier.hit()

          files.forEach((file) => {
            let filePath = path.join(dir, file)

            fs.stat(filePath, (err, stats) => {
              if(err) {
                errors.push("Error statting file: "+err)
                barrier.hit()
              } else {
                if(stats.isDirectory()) {
                  JSON[file] = {}
                  loadDir(path.join(dir, file), JSON[file])
                } else {
                  if(promise) {
                    promise(filePath)
                      .then((result) => {
                        JSON[file.slice(0, -5)] = result
                        barrier.hit()
                      })
                      .catch((err) => {
                        errors.push("Error executing file: "+err)
                        barrier.hit()
                      })
                  } else {
                    JSON[file.slice(0, -5)] = file
                    barrier.hit()
                  }
                }
              }
            })
          })
        }
      })
    }

    loadDir(dir, acc)
  })
}

loadDir("jsql")
  .then((JSON) => {
    console.log("Finished:", JSON)
  })
  .catch((err) => {
    console.error("Failed to load directory with:", err)
  })

let readFile = function(file) {
  return new Promise((pass, fail) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if(err) {
        fail(err)
      } else {
        let result = data
        pass(result)
      }
    })
  })
}

loadDir("jsql", readFile)
  .then((JSON) => {
    console.log("Finished:", JSON)
  })
  .catch((err) => {
    console.error("Failed to load directory with:", err)
  })
