module.exports = function parseArgs() {
	const args = process.argv.slice(2);
	const argMap = {};

	if (args.length % 2) throw new Error("Invalid number of arguments");

	for (let i = 0; i < args.length; i += 2) {
		let key = args[i];

		if (!/^--([a-z]+-)*[a-z]+$/g.test(key)) throw new Error("Invalid argument name");

		key = key.replace(/^--/, "").replace(/-([a-z])/g, g => g[1].toUpperCase());

		argMap[key] = args[i + 1];
    }
    return argMap
}
