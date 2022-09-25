import { faker } from "@faker-js/faker"
import fs from "node:fs/promises"

const USERS = []
const usersCount = 20

export function createRandomUser() {
	const gender = faker.datatype.boolean() ? "male" : "female"
	const firstName = faker.name.firstName(gender)
	const lastName = faker.name.lastName(gender)
	const provider = "example.com"
	return {
		userId: faker.datatype.uuid(),
		firstName: firstName,
		lastName: lastName,
		email: faker.internet.email(firstName, lastName, provider),
		avatarUrl: faker.image.avatar(),
		userName: faker.internet.userName(firstName, lastName),
	}
}

Array.from({ length: usersCount }).forEach(() => {
	USERS.push(createRandomUser())
})

const saveData = async (content) => {
	try {
		await fs.writeFile("users.json", content)
	} catch (error) {
		console.log(error)
	}
}

saveData(JSON.stringify(USERS, null, "\t")).then(() => console.log("Finished!"))
