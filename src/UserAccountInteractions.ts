import mysql from "mysql";
import tell from "./tell";
export default class UserAccountInteractions {
	db: mysql.Connection;
	constructor(db: mysql.Connection) {
		this.db = db;
	}
	get(uid: number, cabinet: string, query: string, value = ""): string {
		const sql = `SELECT \`cabinet_${cabinet.toLowerCase()}\` FROM \`userdata\` WHERE \`user_id\` = "${uid}"`;
		var op = "";
		this.db.query(sql, function (err, result) {
			if (err) throw err + "userid: " + uid;
			const jsondata = result[0][`cabinet_${cabinet.toLowerCase()}`];
			switch (true) {
				case value === "json":
					op = jsondata;
					break;
				// case value === "object":
				// 	op: Object = JSON.parse(jsondata);
				// 	break;
				default:
					if (query in JSON.parse(jsondata)) {
						op = JSON.parse(jsondata)[query];
					} else {
						op = "";
						tell.warn("Query does not exist in this cabinet");
						break;
					}
					break;
			}
		});
		return op;
	}
} 