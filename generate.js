import { faker } from "@faker-js/faker"
import _ from "lodash"
import fs from "node:fs/promises"

let users = []
let messages = []
let posts = []
const usersCount = 20
const minMessagesCount = 2
const maxMessagesCount = 10
const maxMessageSentences = 3
const minMessageDate = 1577836800000
const maxMessageDate = Date.now()
const maxPostsCount = 5
const maxTitleLength = 4
const postImageWidth = 480
const postImageHeight = 270

const createRandomUser = (userId) => {
	const gender = faker.datatype.boolean() ? "male" : "female"
	const firstName = faker.name.firstName(gender)
	const lastName = faker.name.lastName(gender)
	const provider = "example.com"
	const user = {
		userId: userId,
		firstName: firstName,
		lastName: lastName,
		email: faker.internet.email(firstName, lastName, provider),
		avatarUrl: faker.image.avatar(),
		userName: faker.internet.userName(firstName, lastName),
	}
	users = [...users, user]
}

const createMessages = (userId) => {
	const messagesCount = faker.datatype.number({ max: maxMessagesCount, min: minMessagesCount })
	let correspondence = []
	Array.from({ length: usersCount }).forEach((el, index) => {
		if (index + 1 !== userId) {
			correspondence = [
				...correspondence,
				{
					targetUserId: index + 1,
					messages: generateUserMessages(messagesCount),
				},
			]
		}
	})

	messages = [
		...messages,
		{
			userId: userId,
			correspondence: correspondence,
		},
	]
}

const generateUniqueNumbersArray = (arrayLength, maxNumber) => {
	let uniqueArray = []
	if (arrayLength < maxNumber) {
		let arrayNumber = 0
		_.times(faker.datatype.number(arrayLength), function () {
			arrayNumber = faker.datatype.number({ min: 1, max: maxNumber })
			while (!uniqueArray.includes(arrayNumber)) {
				uniqueArray = [...uniqueArray, arrayNumber]
			}
		})
	}
	uniqueArray.sort((a, b) => a - b)
	return uniqueArray
}

const generateMessage = () => {
	const date = faker.datatype.datetime({ min: minMessageDate, max: maxMessageDate })
	return {
		text: faker.lorem.sentences(faker.datatype.number({ max: maxMessageSentences, min: 1 })),
		timestamp: date.getTime(),
		isOwn: faker.datatype.boolean(),
	}
}

const generateUserMessages = (messagesCount) => {
	let messages = Array.from({ length: messagesCount }).map(() => generateMessage())
	messages.sort((a, b) => sortByNumber(a.timestamp, b.timestamp))
	return messages
}

const generatePost = (id, userId) => ({
	id: id,
	userId: userId,
	title: faker.lorem.sentence(faker.datatype.number({ max: maxTitleLength, min: 2 })),
	text: faker.lorem.text(),
	imageUrl: faker.image.abstract(postImageWidth, postImageHeight, true),
})

let lastPostId = 1

const createPosts = (userId) => {
	const postCount = faker.datatype.number({ max: maxPostsCount, min: 1 })
	let newPost = Array.from({ length: postCount }).map((el, index) =>
		generatePost(index + lastPostId, userId)
	)
	posts = [...posts, ...newPost]
	lastPostId = lastPostId + postCount
}

const sortByNumber = (a, b) => {
	if (a < b) {
		return -1
	} else if (a > b) {
		return 1
	}
	return 0
}

Array.from({ length: usersCount }).forEach((el, index) => {
	let userId = index + 1
	createRandomUser(userId)
	createMessages(userId)
	createPosts(userId)
})

const saveData = async (content, filename) => {
	try {
		await fs.writeFile(filename + ".json", content)
	} catch (error) {
		console.log(error)
	}
}

saveData(JSON.stringify(users, null, "\t"), "users").then(() => console.log("Finished users!"))
saveData(JSON.stringify(posts, null, "\t"), "posts").then(() => console.log("Finished posts!"))
saveData(JSON.stringify(messages, null, "\t"), "messages").then(() =>
	console.log("Finished messages!")
)
