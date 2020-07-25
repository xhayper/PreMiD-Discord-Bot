import * as Discord from "discord.js";
import assignee from "../assignee";
import config from "../../../config";
import assignRolesFile from "../assignRoles";

let embed: Discord.MessageEmbed;

module.exports.run = async (
	message: Discord.Message,
	params: Array<String>
) => {
	let roleCheck: { movieNight?: string; minecraft?: string;
		linuxTest?: string; vacation?: string; } = {};
		
		roleCheck.movieNight = assignRolesFile.everyone.movieNight;
		
		if (message.member.hasPermission("ADMINISTRATOR")) {
			roleCheck.minecraft = assignRolesFile.betaAndAlpha.minecraft;
			roleCheck.vacation = assignRolesFile.staff.vacation;
			roleCheck.linuxTest = assignRolesFile.linuxMaintainer.linuxTest;
		} else {
			if (message.member.roles.cache.has(assignee.alphaRole))
			{
				roleCheck.minecraft = assignRolesFile.betaAndAlpha.minecraft;
			}
	
			if (message.member.roles.cache.has(assignee.betaRole))
			{
				roleCheck.minecraft = assignRolesFile.betaAndAlpha.minecraft;
			}
	
			if (message.member.roles.cache.has(assignee.staff))
			{
				roleCheck.vacation = assignRolesFile.staff.vacation;
			}
			
			if (message.member.roles.cache.has(assignee.LinuxMaintainer))
			{
				roleCheck.linuxTest = assignRolesFile.linuxMaintainer.linuxTest;
			}
		}
	

	let assignRoles: Discord.Role[] = Object.values(roleCheck)
	.map(r => message.guild.roles.cache.get(r))
	.filter(v => v != undefined);

	if (params.length == 0) {
		message.delete();
		embed = new Discord.MessageEmbed({
			title: "Unassignable Roles",
			description: `*You can unassign these roles by typing\:
			\`\`${config.prefix}assign <roleName> [optionnaly tag a member to remove the role from]\`\`*

			${assignRoles.map(r => `**${r.name}**`).join(", ")}`,
			color: "#7289DA"
		});

		message.channel
			.send(embed)
			.then(msg => (msg as Discord.Message).delete({ timeout: 10 * 1000 }));
		return;
	}

	let lastEl = params[(params.length - 1)];
	if (lastEl.startsWith('<@') && lastEl.endsWith('>')){
		params.pop();
	}
	
	let assignRole = assignRoles.filter(
		r => r.name.toLowerCase() == params.join(" ").toLowerCase()
	);

	if (assignRole.length == 0) {
		embed = new Discord.MessageEmbed({
			title: "Unassign",
			description: `Role **${params.join(" ")}** does not exist.`,
			color: "#ff5050"
		});
		message.channel
			.send(embed)
			.then(msg => (msg as Discord.Message).delete({ timeout: 10 * 1000 }));
		return;
	}

	let asRole = assignRole[0];
	const mentioned = message.mentions.members.first();

	let userToAddRole = message.member;

	if (mentioned != undefined){
		if (message.member.hasPermission("ADMINISTRATOR") 
			|| (asRole.id == assignRolesFile.linuxMaintainer.linuxTest
			&& message.member.roles.cache.has(assignee.LinuxMaintainer) 
			|| (message.member.roles.cache.has(assignee.staffHead)
			&& asRole.id == assignRolesFile.staff.vacation)
		)){
			userToAddRole = mentioned;
		} else {
			message.react("❌");
			let description = `You do not have permission to remove the role to user **${mentioned.displayName}**.`;
			embed = new Discord.MessageEmbed({
				title: "Assign",
				description,
				color: "#ff5050"
			});
		
			message.channel.send(embed).then(msg => {
				message.delete({ timeout: 10 * 1000 });
				(msg as Discord.Message).delete({ timeout: 10 * 1000 });
			});
			return ;
		}
	}

	if (userToAddRole && !userToAddRole.roles.cache.has(asRole.id)) {
		message.react("❌");
		let description = userToAddRole == mentioned ?
		`User **${userToAddRole.displayName}** doesn't have the **${asRole.name}** role.` : `You don't have the **${asRole.name}** role.`;
		embed = new Discord.MessageEmbed({
			title: "Unassign",
			description,
			color: "#ff5050"
		});
	} else {
		if (userToAddRole)
		userToAddRole.roles.remove(asRole.id);
		message.react("✅");
		let description = userToAddRole == mentioned ?
		`Unassigned **${asRole.name}** role from user **${userToAddRole.displayName}**.` : `Unassigned **${asRole.name}** role.`;
		embed = new Discord.MessageEmbed({
			title: "Unassign",
			description,
			color: "#50ff50"
		});
	}
	message.channel.send(embed).then(msg => {
		message.delete({ timeout: 10 * 1000 });
		(msg as Discord.Message).delete({ timeout: 10 * 1000 });
	});
};

module.exports.config = {
	name: "unassign",
	description: "Unassign yourself roles."
};
