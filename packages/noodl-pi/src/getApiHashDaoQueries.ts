import type { ExecuteSQL } from './types'

function getApiHashDaoQueries(run: ExecuteSQL, tableName: string) {
  return {
    getResult(inputHash: string) {
      return run(
        `SELECT resultId FROM ${tableName} WHERE api_input_hash = ${inputHash}`,
      )
    },
    insertResult(inputHash: string, result: string) {
      return run(`INSERT INTO ${tableName} VALUES (${inputHash}, ${result});`)
    },
    deleteResult(inputHash: string) {
      return run(
        `DELETE FROM api_hash_table WHERE api_input_hash = ${inputHash}`,
      )
    },
  }
}

export default getApiHashDaoQueries
