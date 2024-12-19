import {varchar,pgTable,integer,serial,text,timestamp,boolean} from 'drizzle-orm/pg-core'

export const Users = pgTable('users', {
    id: serial('id').primaryKey(),
    koracustomerId: text('kora_customer_id').unique(),
    email: serial('email').notNull().unique(),
    name:text('name'),
    points: integer('points').default(50),
    timestamp: timestamp('timestamp').defaultNow()
})

export const Subscription = pgTable('subscription',{
    korasubscripionId: varchar('kora_subscripion_id',{length: 255}).notNull(),
    userid: integer('user_id').references(() => Users.id).notNull(),
    plan: varchar('plan',{length:50}).notNull(),
    startdate: timestamp('start_date').defaultNow(),
    enddate: timestamp('end_date').defaultNow(),
   canceldate: boolean('cancel_date').notNull().default(false)
})

export const GeneratedContent = pgTable("generated_content", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => Users.id)
      .notNull(),
    content: text("content").notNull(),
    prompt: text("prompt").notNull(),
    contentType: varchar("content_type", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  