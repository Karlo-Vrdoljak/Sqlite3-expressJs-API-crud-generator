const args = require("./argParser")();
const sqlite3 = require("sqlite3").verbose();
const clipboardy = require("clipboardy");
var db = new sqlite3.Database(args.db);

const operations = ["C", "R", "U", "D"].map(op => {
	return args.ops.includes(op)
		? {
				operation: op,
				use: true,
		  }
		: {
				operation: op,
				use: false,
		  };
});

const table = args.table || null;
if (table) {
	let fn = (result, fnSpec) => `${fnSpec} => {
            if(err) {
                console.error(err);
                res.status(500).send(err);
            }
            // todo handle
            res.send(${result});
        }`;
	db.serialize(() => {
		db.get(`select * from ${table} limit 1`, (err, row) => {
			let keys = Object.keys(row);
			operations.forEach(op => {
				if (op.use) {
					switch (op.operation) {
						case "C": {
							let sql = `INSERT INTO [${table}] (${keys.filter((key, i) => (i != 0 ? true : false)).join(",")}) values (${keys
								.filter((key, i) => (i != 0 ? true : false))
								.map(key => "?")
								.join(",")})`;
							let args = keys
								.filter((key, i) => (i != 0 ? true : false))
								.map(key => `req.body.${key}`)
								.join(",");

							op.result = `
                            router.post("/insert", async (req, res) => {
                                db.serialize(() => {

                                    db.run('${sql}', ${args},function (err){
                                      if(err) {
                                          console.error(err);
                                          res.status(500).send(err);
                                      }
                                      // todo handle
                                      db.serialize(() => {
                                        db.get('select * from ${table} where ${keys[0]} = ?', this.lastID ,${fn("insertedRow", "(err,insertedRow)")})
                                      });
                                  });
                                });
                            });
                            `;
							return;
						}

						case "R": {
							let sqlAll = `select * from ${table}`;
							let sqlOne = `select * from ${table} where ${keys[0]} = ?`;
							let args = `${"req.query"}.${keys[0]}`;
							op.result = `
                            router.get("/all", async (req, res) => {
                                db.serialize(() => {
                                    db.all('${sqlAll}', ${fn("rows", "(err,rows)")})
                                });
                            });
                            
                            router.get("/one", async (req, res) => {
                                db.serialize(() => {
                                    db.get('${sqlOne}', ${args} ,${fn("row", "(err,row)")})
                                });
                            });
                            `;
							return;
						}
						case "U": {
							if (row) {
								let sql =
									`update ${table} set ` +
									keys
										.filter((key, i) => (i != 0 ? true : false))
										.map(key => `${key} = ?`)
										.join(", ") +
									` where ${keys[0]} = ?`;
								let args = [...keys.filter((key, i) => (i != 0 ? true : false)).map(k => `${"row"}.${k}`), `${"row"}.${keys[0]}`];
								// if (req.body.color) row.color = req.body.color;
								op.result = `
                            router.put("/update", async (req, res) => {
                                db.serialize(() => {
                                db.get('select * from ${table} where ${keys[0]} = ?', req.body.${keys[0]} ,(err, row) => {
                                        ${keys
																					.filter((key, i) => (i != 0 ? true : false))
																					.map(i => `if(req.body.${i}) row.${i} = req.body.${i}`)
																					.join("\n")}
                                        db.prepare('${sql}', ${args}).run().finalize(${fn("row", "(err)")})
                                    });
                                });
                            });`;
							}

							return;
						}
						case "D": {
							if (row) {
								let sql = `delete from ${table} where ${keys[0]} = ?`;
								let args = `${"req.body"}.${keys[0]}`;
								op.result = `
                                router.delete("/delete", async (req, res) => {
                                    db.serialize(() => {
                                        db.run('${sql}', ${args}, ${fn("{status: 'OK'}", "(err)")})
                                    });
                                });`;
							}

							return;
						}

						default:
							break;
					}
				}
			});
			let header = `
            const router = require("express").Router();
            const [connection, db] =  require("../sqlite.js");
            `;
			let end = `
            module.exports = router;
            `;
			clipboardy.writeSync([header, operations.map(op => op.result).join("\n"), end].join("\n"));
			console.log("Copied to clipboard!!");
		});
	});
}
