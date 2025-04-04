import { 
  users, type User, type InsertUser, 
  type GeneratedEmail, type InsertGeneratedEmail
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Email generation operations
  createGeneratedEmail(email: InsertGeneratedEmail): Promise<GeneratedEmail>;
  getGeneratedEmails(): Promise<GeneratedEmail[]>;
  getGeneratedEmailById(id: number): Promise<GeneratedEmail | undefined>;
  updateGeneratedEmail(id: number, update: Partial<InsertGeneratedEmail>): Promise<GeneratedEmail | undefined>;
  deleteGeneratedEmail(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private emails: Map<number, GeneratedEmail>;
  private userCurrentId: number;
  private emailCurrentId: number;

  constructor() {
    this.users = new Map();
    this.emails = new Map();
    this.userCurrentId = 1;
    this.emailCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Email generation methods
  async createGeneratedEmail(insertEmail: InsertGeneratedEmail): Promise<GeneratedEmail> {
    const id = this.emailCurrentId++;
    const email: GeneratedEmail = { 
      ...insertEmail, 
      id, 
      createdAt: insertEmail.createdAt || new Date(),
      isReviewed: insertEmail.isReviewed || false,
      isEdited: insertEmail.isEdited || false
    };
    this.emails.set(id, email);
    return email;
  }

  async getGeneratedEmails(): Promise<GeneratedEmail[]> {
    return Array.from(this.emails.values());
  }

  async getGeneratedEmailById(id: number): Promise<GeneratedEmail | undefined> {
    return this.emails.get(id);
  }

  async updateGeneratedEmail(id: number, update: Partial<InsertGeneratedEmail>): Promise<GeneratedEmail | undefined> {
    const email = this.emails.get(id);
    if (!email) return undefined;

    const updatedEmail = { ...email, ...update };
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }

  async deleteGeneratedEmail(id: number): Promise<boolean> {
    return this.emails.delete(id);
  }
}

export const storage = new MemStorage();
