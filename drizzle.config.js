export default {
    dialect: "postgresql",
    schema:"./utils/db/schema.ts",
    out: './drizzle',

    dbCredentials: {
        url:"postgresql://fluet_owner:O0mzILeGUb3x@ep-bold-sun-a52lj3ws.us-east-2.aws.neon.tech/fluet?sslmode=require",
        connectionString:"postgresql://fluet_owner:O0mzILeGUb3x@ep-bold-sun-a52lj3ws.us-east-2.aws.neon.tech/fluet?sslmode=require"
    }
}