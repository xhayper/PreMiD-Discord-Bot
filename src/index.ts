import "source-map-support/register";

import * as Discord from "discord.js";
import { config } from "dotenv";

import { connect, MongoClient } from "./database/client";
import roles from "./roles";
import { error, success } from "./util/debug";
import moduleLoader from "./util/moduleLoader";

//* Load .env file
config();

//* Create new client & set login presence
export let client = new Discord.Client({
	presence:
		process.env.NODE_ENV == "dev"
			? {
					status: "dnd",
					activity: {
						name: "devs code",
						type: "WATCHING"
					}
			  }
			: {
					status: "online",
					activity: {
						name: "p!help",
						type: "LISTENING"
					}
			  }
});

//* Commands, Command aliases, Command permission levels
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.infos = new Discord.Collection();
client.infoAliases = new Discord.Collection();

client.elevation = async (userId: string) => {
	//* Permission level checker
	let permlvl: Number = 0;

	const member = await client.guilds.cache
		.get("493130730549805057")
		.members.fetch(userId);

	if (!member) return 0;

	const memberRoles = member.roles.cache;

	//* Ticket Manager
	if (memberRoles.has(roles.ticketManager)) permlvl = 1;
	//* Mod
	if (memberRoles.has(roles.moderator)) permlvl = 3;
	//* Jr Mod
	if (memberRoles.has(roles.jrModerator)) permlvl = 2;
	//* Admin
	if (
		memberRoles.has(roles.administrator) ||
		member.permissions.has("ADMINISTRATOR")
	)
		permlvl = 4;
	//* Dev
	if (memberRoles.has(roles.developer)) permlvl = 5;

	//* Return permlvl
	return permlvl;
};

run();

//! Make sure that database is connected first then proceed
async function run() {
	//* Connect to Mongo DB
	connect()
		.then(_ => {
			success("Connected to the database");
			client.login(process.env.TOKEN).then(async () => moduleLoader(client));
		})
		.catch((err: Error) => {
			error(`Could not connect to database: ${err.name}`);
			process.exit();
		});
}

//* PM2 shutdown signal
process.on("SIGINT", async () => {
	await Promise.all([MongoClient.close(), client.destroy()]);
	process.exit();
});

process.on("unhandledRejection", (err: any) => {
	error(err.stack.toString());

	const wh = process.env.ERRORSWEBHOOK.split(","),
		hook = new Discord.WebhookClient(wh[0], wh[1]);

	hook.send(
		new Discord.MessageEmbed({
			title: "Discord-Bot",
			color: "#ff5050",
			description: `\`\`\`${err.stack.toString()}\`\`\``
		})
	);
});
