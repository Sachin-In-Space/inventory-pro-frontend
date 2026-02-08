import { Injectable, signal } from '@angular/core';
import * as Realm from 'realm-web';

// Placeholder App ID - User must replace this with their actual Atlas App ID
const APP_ID = 'application-0-xyz';

@Injectable({
    providedIn: 'root'
})
export class MongoAuthService {
    private app: Realm.App;
    currentUser = signal<Realm.User | null>(null);

    constructor() {
        this.app = new Realm.App({ id: APP_ID });
        this.currentUser.set(this.app.currentUser);
    }

    get isLoggedIn() {
        return !!this.currentUser();
    }

    async login(email: string, password: string): Promise<Realm.User> {
        const credentials = Realm.Credentials.emailPassword(email, password);
        try {
            const user = await this.app.logIn(credentials);
            this.currentUser.set(user);
            return user;
        } catch (err) {
            console.error('Failed to log in', err);
            throw err;
        }
    }

    async logout() {
        await this.app.currentUser?.logOut();
        this.currentUser.set(null);
    }

    // Helper to get the MongoDB client for database operations
    get mongoClient() {
        return this.app.currentUser?.mongoClient('mongodb-atlas');
    }
}
