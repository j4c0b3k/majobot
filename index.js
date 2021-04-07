const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const http = require('http');
const db = require("quick.db")
const discord_token = process.env.TOKEN;
const prefix = process.env.PREFIX;
const newUsers = new Discord.Collection();
var botMembers = 0;

/* YOUTUBE SEARCH */
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const queue = new Map();
/* --- */

/* DASHBOARD */
const express = require('express');
const app = express();

const dashboard = process.env.DASHBOARD;

if (dashboard === 'true') {
let port = process.env.PORT || require('./config.json').port || 8000;
app.set('port', port);

const session = require('express-session');

app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(session({
    secret: '48738924783748273742398747238',
    resave: false,
    saveUninitialized: false,
    expires: 604800000,
}));
require('./router')(app);

app.listen(port, () => console.info('Dashboard aktywny na porcie ' + `${port}`));

app.get("/", (request, response) => {
  response.sendStatus(200);
});
} else {
console.info('Dashboard jest wyłączony. Aby go włączyć zmień "DASHBOARD" wartość w .env pliku na "true" (Teraz ustawione na "' + `${dashboard}` +'").')
}
/* --- */



/* RUN COMMANDS */
client.on("message", message => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  if(message.content.indexOf(prefix) !== 0) return;
if (message.length >= 1999) {
return message.channel.send({embed: {
                color: 16734039,
                description: "Przepraszam lecz nie moge wysłać wiadomości większej niż 2000 znaków :cry:"
            }})
}
  // This is the best way to define args. Trust me.
  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // The list of if/else is replaced with those simple 2 lines:
  try {
    let commandFile = require(`./commands/${command}.js`);
	  if(commandFile.length <= 0){
    return console.log("Nie mogłem znaleźć żadnych komend w /commands/ pliku!");
	}
    commandFile.run(client, message, args);
  } catch (err) {
	console.log(err);
    message.channel.send({embed: {
                color: 16734039,
                description: "Nie znam takiej komendy. Wszystkie znajdziesz pod " + `${prefix}` + " help!"
            }})
  }
});

client.on('message', message=> {
     if (message.isMentioned(client.user.id)) {
     if (message.author.bot) return;
     if (!message.guild) return;
	 
    return message.channel.send({embed: {
        color: 16734039,
        description: "Moge tylko odpowiedzieć na polecenia z moim prefixem - (" + `${prefix}` + ")"
        }})
}
});
/* --- */

/* WELCOME AND BYE MESSAGES */
client.on("guildMemberAdd", (member) => {
	const guild = member.guild;
	let addset = member.guild.channels.find("name", "hello-or-bye")  
    if(addset) {
     const guild = member.guild;
     newUsers.set(member.id, member.user);
     let embed = new Discord.RichEmbed()
      .setDescription(`**${member.displayName}#${member.user.discriminator}** dołączył na nasz serwer!.`)
      .setThumbnail(member.user.displayAvatarURL)
      .setColor("RANDOM")
      .setTimestamp()
      .setFooter(`Wszyscy: ${member.guild.memberCount}`)    
    
     addset.send(embed=embed);    
     if (newUsers.size > 5) {
                }
	} else {
	 const guild = member.guild;
     newUsers.set(member.id, member.user);
	 let chx = db.get(`welchannel_${member.guild.id}`);
  
     if(chx === null) {
      return;
     }

     let embed = new Discord.RichEmbed()
      .setDescription(`**${member.displayName}#${member.user.discriminator}** dołączył na serwer!.`)
      .setThumbnail(member.user.displayAvatarURL)
      .setColor("RANDOM")
      .setTimestamp()
      .setFooter(`Wszyscy: ${member.guild.memberCount}`)    
  
     client.channels.get(chx).send(embed=embed);
  
     if (newUsers.size > 5) {
       newUsers.clear();
     }
	}
});

client.on("guildMemberRemove", (member) => {
	const guild = member.guild;
	let addset = member.guild.channels.find("name", "hello-or-bye")  
    if(addset) {
     const guild = member.guild;
     newUsers.set(member.id, member.user);
     let embed = new Discord.RichEmbed()
      .setDescription(`**${member.displayName}#${member.user.discriminator}** wyszedł z serwera!.`)
      .setThumbnail(member.user.displayAvatarURL)
      .setColor("RANDOM")
      .setTimestamp()
      .setFooter(`Wszyscy: ${member.guild.memberCount}`)    
    
     addset.send(embed=embed);    
     if (newUsers.size > 5) {
                }
	} else {
	 const guild = member.guild;
     newUsers.set(member.id, member.user);
	 let chx2 = db.get(`byechannel_${member.guild.id}`);
  
     if(chx2 === null) {
      return;
     }

     let embed = new Discord.RichEmbed()
      .setDescription(`**${member.displayName}#${member.user.discriminator}** opuścił nasz serwer!.`)
      .setThumbnail(member.user.displayAvatarURL)
      .setColor("RANDOM")
      .setTimestamp()
      .setFooter(`Wszyscy: ${member.guild.memberCount}`)    
  
     client.channels.get(chx2).send(embed=embed);
  
     if(newUsers.has(member.id)) newUsers.delete(member.id);
	}
});
/* --- */



/* MESSAGES ON CLIENT (BOT) JOIN OR LEAVE */
client.on("guildCreate", guild => {
  const defaultChannel = getDefaultChannel(guild); 
  let embed = new Discord.RichEmbed()
    .setTitle(`Cześć!`)
	.setDescription(`Dziękuję, że dodałeś mnie na ten serwer!`)
    .setColor("RANDOM")
    .setTimestamp()
    
  defaultChannel.send(embed=embed);  
  console.log(`Dołączyłem do: ${guild.name} (id: ${guild.id}). Ta grupa posiada ${guild.memberCount} członków!`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`Usunięto mnie z: ${guild.name} (id: ${guild.id})`);
});
/* --- */



/* LOGS (IN #LOGS CHANNEL) */
function getDefaultChannel(guild) { 
  if (guild.systemChannelID) 
    if (guild.channels.get(guild.systemChannelID).permissionsFor(guild.client.user).has("SEND_MESSAGES")) return guild.channels.get(guild.systemChannelID)  
  
  if(guild.channels.exists("name", "general"))
    if (guild.channels.find("name", "general").permissionsFor(guild.client.user).has("SEND_MESSAGES")) return guild.channels.find("name", "general")   

  return guild.channels
   .filter(c => c.type === "text" &&
     c.permissionsFor(guild.client.user).has("SEND_MESSAGES"))
   .first();  
}

client.on('messageDelete', message => {  
try {
    if(message.author.bot) return;
    if(message.channel.type === 'dm') return;  
    if(!message.guild.member(client.user).hasPermission('EMBED_LINKS')) return;  
    if(!message.guild.member(client.user).hasPermission('MANAGE_MESSAGES')) return;  
 
    var logChannel = message.guild.channels.find(c => c.name === 'log');  
    if(!logChannel) return;  
 
    let messageDelete = new Discord.RichEmbed()  
    .setTitle('**WIADOMOŚĆ USUNIĘTA**')  
    .setColor('RANDOM')  
    .setThumbnail(message.author.avatarURL)  
    .setDescription(`**\n**:wastebasket: Poprawnie \`\`usunięto\`\` **WIADOMOŚĆ** W ${message.channel}\n\n**KANALE:** \`\`${message.channel.name}\`\` (ID: ${message.channel.id})\n**ID WIADOMOŚCI:** ${message.id}\n**WYSŁANE PRZEZ:** <@${message.author.id}> (ID: ${message.author.id})\n**WIADOMOŚĆ:**\n\`\`\`${message}\`\`\``)
    .setTimestamp()  
    .setFooter(message.guild.name, message.guild.iconURL)  
 
    logChannel.send(messageDelete);
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('messageUpdate', (oldMessage, newMessage) => {  
try {
    if(oldMessage.author.bot) return;
    if(!oldMessage.channel.type === 'dm') return;
    if(!oldMessage.guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!oldMessage.guild.member(client.user).hasPermission('MANAGE_MESSAGES')) return;
 
    var logChannel = oldMessage.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return;
 
    if(oldMessage.content.startsWith('https://')) return;  
 
    let messageUpdate = new Discord.RichEmbed()
    .setTitle('**WIADOMOŚĆ ZEDYTOWANA**')
    .setThumbnail(oldMessage.author.avatarURL)
    .setColor('RANDOM') 
    .setDescription(`**\n**:wrench: Poprawnie \`\`ZEDYTOWANO\`\` **WIADOMOŚĆ** W ${oldMessage.channel}\n\n**KANALE:** \`\`${oldMessage.channel.name}\`\` (ID: ${oldMessage.channel.id})\n**Message ID:** ${oldMessage.id}\n**Wysłane przez:** <@${oldMessage.author.id}> (ID: ${oldMessage.author.id})\n\n**STARA WIADOMOŚĆ:**\`\`\`${oldMessage}\`\`\`\n**NOWA WIADOMOŚĆ:**\`\`\`${newMessage}\`\`\``)
    .setTimestamp()
    .setFooter(oldMessage.guild.name, oldMessage.guild.iconURL)
 
    logChannel.send(messageUpdate);
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('roleCreate', role => {
try {
    if(!role.guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!role.guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = role.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return;
 
    role.guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id;
        var userAvatar = logs.entries.first().executor.avatarURL;
 
        let roleCreate = new Discord.RichEmbed()
        .setTitle('**STWORZONO ROLE**')
        .setThumbnail(userAvatar)  
        .setDescription(`**\n**:white_check_mark: Poprawnie \`\`STWORZONO\`\` role.\n\n**NAZWA ROLI:** \`\`${role.name}\`\` (ID: ${role.id})\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
        .setColor('RANDOM') 
        .setTimestamp()
        .setFooter(role.guild.name, role.guild.iconURL)  
   
        logChannel.send(roleCreate);
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('roleDelete', role => {  
try {
    if(!role.guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!role.guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = role.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return;
 
    role.guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id;
        var userAvatar = logs.entries.first().executor.avatarURL;
 
        let roleDelete = new Discord.RichEmbed()
        .setTitle('**ROLA USUNIĘTA**')
        .setThumbnail(userAvatar)  
        .setDescription(`**\n**:white_check_mark: Poprawnie \`\`USUNIĘTO\`\` role.\n\n**NAZWA ROLI:** \`\`${role.name}\`\` (ID: ${role.id})\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
        .setColor('RANDOM')
        .setTimestamp()  
        .setFooter(role.guild.name, role.guild.iconURL)
 
        logChannel.send(roleDelete);  
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('roleUpdate', (oldRole, newRole) => {
try {
    if(!oldRole.guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!oldRole.guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = oldRole.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return;
   
    oldRole.guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id;
        var userAvatar = logs.entries.first().executor.avatarURL;
   
        if(oldRole.name !== newRole.name) {
            let roleUpdateName = new Discord.RichEmbed()
            .setTitle('**ZAAKTUALIZOWANO NAZWE ROLI**')  
            .setThumbnail(userAvatar)  
            .setColor('RANDOM') 
            .setDescription(`**\n**:white_check_mark: Poprawnie \`\`ZMIENIONO\`\` nazwe roli.\n\n**STARA NAZWA:** \`\`${oldRole.name}\`\`\n**NOWA NAZWA:** \`\`${newRole.name}\`\`\n**ID ROLI:** ${oldRole.id}\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
            .setTimestamp()
            .setFooter(oldRole.guild.name, oldRole.guild.iconURL)
 
            logChannel.send(roleUpdateName);  
        }
        if(oldRole.hexColor !== newRole.hexColor) {  
            if(oldRole.hexColor === '#000000') {  
                var oldColor = '`Default`';  
            }else {
                var oldColor = oldRole.hexColor;
            }    
            if(newRole.hexColor === '#000000') {  
                var newColor = '`Default`';  
            }else {
                var newColor = newRole.hexColor;  
            }  
            let roleUpdateColor = new Discord.RichEmbed()  
            .setTitle('**ZAAKTUALIZOWANO KOLOR ROLI**')  
            .setThumbnail(userAvatar)  
            .setColor('RANDOM') 
            .setDescription(`**\n**:white_check_mark: Poprawnie \`\`ZAAKTUALIZOWANO\`\` **${oldRole.name}** kolor roli.\n\n**STARY KOLOR:** ${oldColor}\n**NOWY KOLOR:** ${newColor}\n**ID ROLI:** ${oldRole.id}\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
            .setTimestamp()  
            .setFooter(oldRole.guild.name, oldRole.guild.iconURL)
   
            logChannel.send(roleUpdateColor);
        }
        if(oldRole.permissions !== newRole.permissions) {  
            let roleUpdate = new Discord.RichEmbed()  
            .setTitle('**ZAAKTUALIZOWANO UPRAWNIENIA ROLI**')  
            .setThumbnail(userAvatar)  
            .setColor('RANDOM') 
            .setDescription(`**\n**:first_place: Poprawnie \`\`ZMIENIONO\`\` **${oldRole.name}** Permisje!\n\n**STARE PERMISJE:** \`\`${oldRole.permissions}\`\`\n**NOWE PERMISJE:** \`\`${newRole.permissions}\`\`\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
            .setTimestamp()
            .setFooter(oldRole.guild.name, oldRole.guild.iconURL)
           
            logChannel.send(roleUpdate) 
        }
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('channelCreate', channel => {
try {
    if(!channel.guild) return;
    if(!channel.guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!channel.guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = channel.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return;
 
    if(channel.type === 'text') {
        var roomType = 'Text';
    }else
    if(channel.type === 'voice') { 
        var roomType = 'Voice';
    }else
    if(channel.type === 'category') { 
        var roomType = 'Category';
    }
 
    channel.guild.fetchAuditLogs().then(logs => { 
        var userID = logs.entries.first().executor.id; 
        var userAvatar = logs.entries.first().executor.avatarURL;
   
        let channelCreate = new Discord.RichEmbed() 
        .setTitle('**STWORZONO KANAŁ**') 
        .setThumbnail(userAvatar)
        .setDescription(`**\n**:white_check_mark: Poprawnie \`\`STWORZONO\`\` **${roomType}** kanał.\n\n**NAZWA KANAŁU:** \`\`${channel.name}\`\` (ID: ${channel.id})\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
        .setColor('RANDOM') 
        .setTimestamp()
        .setFooter(channel.guild.name, channel.guild.iconURL)
 
        logChannel.send(channelCreate);
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
}); 

client.on('channelDelete', channel => {
try {
    if(!channel.guild) return;
    if(!channel.guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!channel.guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = channel.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return; 
 
    if(channel.type === 'text') { 
        var roomType = 'Text';
    }else
    if(channel.type === 'voice') { 
        var roomType = 'Voice';
    }else
    if(channel.type === 'category') { 
        var roomType = 'Category';
    }
 
    channel.guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id;
        var userAvatar = logs.entries.first().executor.avatarURL;
 
        let channelDelete = new Discord.RichEmbed()
        .setTitle('**USUNIĘTO KANAŁ**')
        .setThumbnail(userAvatar) 
        .setDescription(`**\n**:white_check_mark: Poprawnie \`\`USUNIĘTO\`\` **${roomType}** kanał.\n\n**NAZWA KANAŁU:** \`\`${channel.name}\`\` (ID: ${channel.id})\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
        .setColor('RANDOM') 
        .setTimestamp()
        .setFooter(channel.guild.name, channel.guild.iconURL)
 
        logChannel.send(channelDelete); 
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('channelUpdate', (oldChannel, newChannel) => {
try {
    if(!oldChannel.guild) return;
 
    var logChannel = oldChannel.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return;
 
    if(oldChannel.type === 'text') {
        var channelType = 'Text';
    }else
    if(oldChannel.type === 'voice') {
        var channelType = 'Voice';
    }else
    if(oldChannel.type === 'category') {
        var channelType = 'Category';
    }
   
    oldChannel.guild.fetchAuditLogs().then(logs => { 
        var userID = logs.entries.first().executor.id;
        var userAvatar = logs.entries.first().executor.avatarURL;

        if(oldChannel.name !== newChannel.name) {
            let newName = new Discord.RichEmbed()
            .setTitle('**EDYCJA KANAŁU**')
            .setThumbnail(userAvatar)
            .setColor('RANDOM') 
            .setDescription(`**\n**:wrench: Poprawnie ZEDYTOWANO **${channelType}** NAZWE KANAŁU\n\n**STARA NAZWA:** \`\`${oldChannel.name}\`\`\n**NOWA NAZWA:** \`\`${newChannel.name}\`\`\n**ID KANAŁU:** ${oldChannel.id}\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
            .setTimestamp() 
            .setFooter(oldChannel.guild.name, oldChannel.guild.iconURL) 
 
            logChannel.send(newName); 
        }
        if(oldChannel.topic !== newChannel.topic) { 
            let newTopic = new Discord.RichEmbed() 
            .setTitle('**EDYCJA KANAŁU**') 
            .setThumbnail(userAvatar)
            .setColor('RANDOM') 
            .setDescription(`**\n**:wrench: Poprawnie ZEDYTOWANO **${channelType}** Temat kanału\n\n**Stary temat:**\n\`\`\`${oldChannel.topic || '(Nie ustawiony)'}\`\`\`\n**Nowy temat:**\n\`\`\`${newChannel.topic || '(Nie ustawiony)'}\`\`\`\n**Kanał:** ${oldChannel} (ID: ${oldChannel.id})\n**PRZEZ:** <@${userID}> (ID: ${userID})`)
            .setTimestamp()
            .setFooter(oldChannel.guild.name, oldChannel.guild.iconURL)
 
            logChannel.send(newTopic);
        }
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod Erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('guildBanAdd', (guild, user) => {
try {
    if(!guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = guild.channels.find(c => c.name === 'log'); 
    if(!logChannel) return; 
 
    guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id;
        var userAvatar = logs.entries.first().executor.avatarURL;
 
        if(userID === client.user.id) return;
 
        let banInfo = new Discord.RichEmbed()
        .setTitle('**BAN**')
        .setThumbnail(userAvatar)
        .setColor('RANDOM') 
        .setDescription(`**\n**:airplane: Poprawnie \`\`ZBANOWANO\`\` **${user.username}** z serwera!\n\n**Użytkownik:** <@${user.id}> (ID: ${user.id})\n**Przez:** <@${userID}> (ID: ${userID})`)
        .setTimestamp()
        .setFooter(guild.name, guild.iconURL)
 
        logChannel.send(banInfo);
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('guildBanRemove', (guild, user) => {
try {
    if(!guild.member(client.user).hasPermission('EMBED_LINKS')) return; 
    if(!guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = guild.channels.find(c => c.name === 'log'); 
    if(!logChannel) return;
 
    guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id;
        var userAvatar = logs.entries.first().executor.avatarURL;
 
        let unBanInfo = new Discord.RichEmbed()
        .setTitle('**UNBAN**')
        .setThumbnail(userAvatar)
        .setColor('RANDOM') 
        .setDescription(`**\n**:unlock: Poprawnie \`\`ODBANOWANO\`\` **${user.username}** z serwera\n\n**Użytkownik:** <@${user.id}> (ID: ${user.id})\n**Przez:** <@${userID}> (ID: ${userID})`)
        .setTimestamp()
        .setFooter(guild.name, guild.iconURL)
 
        logChannel.send(unBanInfo);
    })
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('guildMemberUpdate', (oldMember, newMember) => { 
try {
    var logChannel = oldMember.guild.channels.find(c => c.name === 'log'); 
    if(!logChannel) return;
 
    oldMember.guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id; 
        var userAvatar = logs.entries.first().executor.avatarURL;
        var userTag = logs.entries.first().executor.tag;
 
        if(oldMember.nickname !== newMember.nickname) {
            if(oldMember.nickname === null) {
                var oldNM = '\`\`???? ??????\`\`';
            }else {
                var oldNM = oldMember.nickname;
            }
            if(newMember.nickname === null) {
                var newNM = '\`\`???? ??????\`\`'; 
            }else {
                var newNM = newMember.nickname;
            }
 
            let updateNickname = new Discord.RichEmbed()
            .setTitle('**ZMIENIONO NICK**')
            .setThumbnail(userAvatar)
            .setColor('RANDOM') 
            .setDescription(`**\n**:spy: Poprawnie \`\`ZMIENIONO\`\` nazwe użytkownika.\n\n**Użytkownik:** ${oldMember} (ID: ${oldMember.id})\n**Stara nazwa:** ${oldNM}\n**Nowa nazwa:** ${newNM}\n**Przez:** <@${userID}> (ID: ${userID})`)
            .setTimestamp()
            .setFooter(oldMember.guild.name, oldMember.guild.iconURL)
  
            logChannel.send(updateNickname);
        }
        if(oldMember.roles.size < newMember.roles.size) {
            let role = newMember.roles.filter(r => !oldMember.roles.has(r.id)).first();
 
            let roleAdded = new Discord.RichEmbed()
            .setTitle('**DODANO ROLE UZYTKOWNIOKWI**') 
            .setThumbnail(oldMember.guild.iconURL)
            .setColor('RANDOM') 
            .setDescription(`**\n**:white_check_mark: Poprawnie \`\`DODANO\`\` role do **${oldMember.user.username}**\n\n**Użytkownik:** <@${oldMember.id}> (ID: ${oldMember.user.id})\n**Rola:** \`\`${role.name}\`\` (ID: ${role.id})\n**Przez:** <@${userID}> (ID: ${userID})`)
            .setTimestamp()
            .setFooter(userTag, userAvatar) 
 
            logChannel.send(roleAdded);
        }
        if(oldMember.roles.size > newMember.roles.size) {
            let role = oldMember.roles.filter(r => !newMember.roles.has(r.id)).first();
 
            let roleRemoved = new Discord.RichEmbed()
            .setTitle('**USUNIĘTO ROLE UZYTKOWNIKOWI**')
            .setThumbnail(oldMember.guild.iconURL)
            .setColor('RANDOM') 
            .setDescription(`**\n**:negative_squared_cross_mark: Poprawnie \`\`USUNIĘTO\`\` role od **${oldMember.user.username}**\n\n**Użytkownik:** <@${oldMember.user.id}> (ID: ${oldMember.id})\n**Rola:** \`\`${role.name}\`\` (ID: ${role.id})\n**Przez:** <@${userID}> (ID: ${userID})`)
            .setTimestamp()
            .setFooter(userTag, userAvatar) 
 
            logChannel.send(roleRemoved);
        }
    })
    if(oldMember.guild.owner.user.id !== newMember.guild.owner.user.id) {
        let newOwner = new Discord.RichEmbed()
        .setTitle('**NOWY WŁAŚCICIEL**')
        .setThumbnail(oldMember.guild.iconURL)
        .setColor('RANDOM') 
        .setDescription(`**\n**:white_check_mark: Poprwnie \`\`ODDANO\`\` właściciela.\n\n**Stary właściciel:** <@${oldMember.user.id}> (ID: ${oldMember.user.id})\n**Nowy właściciel:** <@${newMember.user.id}> (ID: ${newMember.user.id})`)
        .setTimestamp()
        .setFooter(oldMember.guild.name, oldMember.guild.iconURL)
 
        logChannel.send(newOwner);
    }
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('guildMemberAdd', member => {
try {
  var logChannel = member.guild.channels.find(c => c.name === 'log'); 
  if(!logChannel) return;
  
  let newMember = new Discord.RichEmbed()
  .setTitle('**NOWY CZŁONEK DOŁĄCZYŁ**') 
  .setThumbnail(member.user.avatarURL)
  .setColor('RANDOM') 
  .setDescription(`**\n**:arrow_lower_right: **${member.user.username}** Dołączył na serwer!\n\n**Użytkownik:** <@${member.user.id}> (ID: ${member.user.id})\n**Konto stworzone:** ${Days(member.user.createdAt)}`)
  .setTimestamp()
  .setFooter(member.user.tag, member.user.avatarURL)
 
  logChannel.send(newMember);
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

function Days(date) {
    let now = new Date();
    let diff = now.getTime() - date.getTime();
    let days = Math.floor(diff / 86400000);
    return days + (days == 1 ? " dzień" : " dni") + " temu";
}
client.on('guildMemberRemove', member => { 
try {
  var logChannel = member.guild.channels.find(c => c.name === 'log'); 
  if(!logChannel) return; 
 
  let leaveMember = new Discord.RichEmbed()
  .setTitle('**CZŁONEK WYSZEDŁ**')
  .setThumbnail(member.user.avatarURL)
  .setColor('RANDOM') 
  .setDescription(`**\n**:arrow_upper_left: **${member.user.username}** opuścił serwer.\n\n**Użytkownik:** <@${member.user.id}> (ID: ${member.user.id})`)  
  .setTimestamp() 
  .setFooter(member.user.tag, member.user.avatarURL)
  
  logChannel.send(leaveMember);
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
});

client.on('voiceStateUpdate', (voiceOld, voiceNew) => {
 try {
    if(!voiceOld.guild.member(client.user).hasPermission('EMBED_LINKS')) return;
    if(!voiceOld.guild.member(client.user).hasPermission('VIEW_AUDIT_LOG')) return;
 
    var logChannel = voiceOld.guild.channels.find(c => c.name === 'log');
    if(!logChannel) return;
 
    voiceOld.guild.fetchAuditLogs().then(logs => {
        var userID = logs.entries.first().executor.id;
        var userTag = logs.entries.first().executor.tag;
        var userAvatar = logs.entries.first().executor.avatarURL;
 

        if(voiceOld.serverMute === false && voiceNew.serverMute === true) {
            let serverMutev = new Discord.RichEmbed()
            .setTitle('**WYMUTOWANY**')
            .setThumbnail('https://images-ext-1.discordapp.net/external/pWQaw076OHwVIFZyeFoLXvweo0T_fDz6U5C9RBlw_fQ/https/cdn.pg.sa/UosmjqDNgS.png')
            .setColor('RANDOM') 
            .setDescription(`**Uzytkownik:** <@${voiceOld.user.id}> (ID: ${voiceOld.user.id})\n**Przez:** <@${userID}> (ID: ${userID})\n**Kanał:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`)
            .setTimestamp()
            .setFooter(userTag, userAvatar)
 
            logChannel.send(serverMutev);
        }

        if(voiceOld.serverMute === true && voiceNew.serverMute === false) {
            let serverUnmutev = new Discord.RichEmbed()
            .setTitle('**ODMUTOWANY**')
            .setThumbnail('https://images-ext-1.discordapp.net/external/u2JNOTOc1IVJGEb1uCKRdQHXIj5-r8aHa3tSap6SjqM/https/cdn.pg.sa/Iy4t8H4T7n.png')
            .setColor('RANDOM') 
            .setDescription(`**Uzytkownik:** <@${voiceOld.user.id}> (ID: ${voiceOld.user.id})\n**Przez:** <@${userID}> (ID: ${userID})\n**Kanał:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`)
            .setTimestamp()
            .setFooter(userTag, userAvatar)
 
            logChannel.send(serverUnmutev);
        }

        if(voiceOld.serverDeaf === false && voiceNew.serverDeaf === true) {
            let serverDeafv = new Discord.RichEmbed()
            .setTitle('**DŹWIEK ZMUTOWANY**')
            .setThumbnail('https://images-ext-1.discordapp.net/external/7ENt2ldbD-3L3wRoDBhKHb9FfImkjFxYR6DbLYRjhjA/https/cdn.pg.sa/auWd5b95AV.png')
            .setColor('RANDOM') 
            .setDescription(`**Uzytkownik:** <@${voiceOld.user.id}> (ID: ${voiceOld.user.id})\n**Przez:** <@${userID}> (ID: ${userID})\n**Kanal:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`)
            .setTimestamp()
            .setFooter(userTag, userAvatar)
 
            logChannel.send(serverDeafv);
        }

        if(voiceOld.serverDeaf === true && voiceNew.serverDeaf === false) {
            let serverUndeafv = new Discord.RichEmbed() 
            .setTitle('**VOICE UNDEAFEN**')
            .setThumbnail('https://images-ext-2.discordapp.net/external/s_abcfAlNdxl3uYVXnA2evSKBTpU6Ou3oimkejx3fiQ/https/cdn.pg.sa/i7fC8qnbRF.png')
            .setColor('RANDOM') 
            .setDescription(`**Uzytkownik:** <@${voiceOld.user.id}> (ID: ${voiceOld.user.id})\n**Przez:** <@${userID}> (ID: ${userID})\n**Kanał:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`)
            .setTimestamp()
            .setFooter(userTag, userAvatar)
 
            logChannel.send(serverUndeafv); 
        }
    })

    if(voiceOld.voiceChannelID !== voiceNew.voiceChannelID && !voiceOld.voiceChannel) {
        let voiceJoin = new Discord.RichEmbed()
        .setTitle('**DOŁĄCZENIE DO KANAŁU**')
        .setColor('RANDOM') 
        .setThumbnail(voiceOld.user.avatarURL)
        .setDescription(`**\n**:arrow_lower_right: Poprawnie \`\`DOŁĄCZYŁ/A\`\` do kanału głosowego.\n\n**Kanał:** \`\`${voiceNew.voiceChannel.name}\`\` (ID: ${voiceNew.voiceChannelID})\n**Uzytkownik:** ${voiceOld} (ID: ${voiceOld.id})`)
        .setTimestamp()
        .setFooter(voiceOld.user.tag, voiceOld.user.avatarURL)
 
        logChannel.send(voiceJoin);
    }

    if(voiceOld.voiceChannelID !== voiceNew.voiceChannelID && !voiceNew.voiceChannel) {
        let voiceLeave = new Discord.RichEmbed()
        .setTitle('**OPUSZCZENIE KANAŁU**')
        .setColor('RANDOM') 
        .setThumbnail(voiceOld.user.avatarURL)
        .setDescription(`**\n**:arrow_upper_left: Poprawnie \`\`WYSZEDŁ/A\`\` z kanału głosowego.\n\n**Kanał:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannelID})\n**Uzytkownik:** ${voiceOld} (ID: ${voiceOld.id})`)
        .setTimestamp()
        .setFooter(voiceOld.user.tag, voiceOld.user.avatarURL)
 
        logChannel.send(voiceLeave); 
    }

    if(voiceOld.voiceChannelID !== voiceNew.voiceChannelID && voiceNew.voiceChannel && voiceOld.voiceChannel != null) {
        let voiceLeave = new Discord.RichEmbed()
        .setTitle('**ZMIANA KANAŁU GŁOSOWEGO**')
        .setColor('RANDOM') 
        .setThumbnail(voiceOld.user.avatarURL)
        .setDescription(`**\n**:repeat: Poprawnie \`\`ZMIENIONO\`\` kanał głosowy.\n\n**Z:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannelID})\n**Do:** \`\`${voiceNew.voiceChannel.name}\`\` (ID: ${voiceNew.voiceChannelID})\n**Uzytkownik:** ${voiceOld} (ID: ${voiceOld.id})`)
        .setTimestamp()
        .setFooter(voiceOld.user.tag, voiceOld.user.avatarURL)
 
        logChannel.send(voiceLeave);
    }
} catch (err) {
         let embed = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle("Error!")
            .setDescription("**Kod erroru:** *" + err + "*")
            .setTimestamp()
            return logChannel.send(embed);
}
}); 
/* --- */



/* LOGIN AND STATUS */

/* Login */
if (discord_token) {
client.login(discord_token);

client.on("ready", () => {
  console.log(`Połączono mnie! Zalogowany jako ${client.user.tag}!`);
});
/* / */
/* Status */
var date = new Date().toJSON().slice(0, 10).replace(/-/g, '/');
const enddate = (new Date().getFullYear()) + "/06/13";
const enddateEEP = (new Date().getFullYear()) + "/04/18";

setInterval(async () => {
    try {
        const statuslist = [

        ];

        if (date == enddate) {
            statuslist.push(
                `🎉 ${client.guilds.size} serwerów 🎉`,
                `🎉 ${client.users.size} członków 🎉`,
                `🎉 ${prefix} help 🎉`,
                `🎉 Wszystkiego najlepszego Discord! 🎉`
            )
        } else if (date == enddateEEP) {
            statuslist.push(
                `🔥 ${client.guilds.size} serwerów 🔥`,
                `🔥 ${client.users.size} członków 🔥`,
                `🔥 ${prefix} help 🔥`,
                `🔥 Schodziarz najlepszy bot! 🔥`
            )
        } else {
            statuslist.push(
                `${client.guilds.size} serwerów`,
                `${client.users.size} członków`,
                `${prefix} help`
            )
        }

        const random = Math.floor(Math.random() * statuslist.length);

        await client.user.setPresence({
            game: {
                name: `${statuslist[random]}`,
                type: 'WATCHING'

            },
            status: "online"
        });

    } catch (err) {
        return console.log(err);
    }
}, 10000);
/* - */
} else {
token = process.env.token;
client.prefix = process.env.prefix;
client.owners = [231408021580939264]; // put your discord user ID in here. can be unlimited
colors = {
	red: '#da0000',
};
}

/* --- */

// ---------
//    END (of index.js)
// ---------