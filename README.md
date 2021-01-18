# Sqlite3 Express.js API CRUD generator
A small nodejs app that generates CRUD for a table in for sqlite3 

I have made this application for personal usage.

# Usage

If you find the need to clone/fork this project, feel free to do just that. 
entry file to this app is **crud.js**, and it requires path parameters that are standardly denoted as --key [value]

## Arguments
* _ops_     
  'C' 'R' 'U' 'D' in any combination, you can leave out any one of them; *string*
* _db_      
  path to your sqlite3 \*.db file
* _table_    
  table name
## Run like below
node .\crud.js --ops CRUD --db path\to\sqlite.db --table sqliteTable
