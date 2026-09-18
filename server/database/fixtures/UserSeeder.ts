import AbstractSeeder from "./AbstractSeeder";

class UserSeeder extends AbstractSeeder {
  constructor() {
    super({ table: "user", truncate: true });
  }

  run() {
    for (let i = 0; i < 10; i += 1) {
      const fakeUser = {
        user_name: this.faker.person.fullName(),
        user_username: this.faker.internet.username(),
        user_mail: this.faker.internet.email(),
        user_password: this.faker.internet.password(),
        user_profile_picture: this.faker.image.avatar(),
        refName: `user_${i}`,
      };

      this.insert(fakeUser);
    }
  }
}

export default UserSeeder;
