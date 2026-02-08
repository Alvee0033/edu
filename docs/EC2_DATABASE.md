# PostgreSQL on EC2

Database is set up on:

- **Host:** `ec2-13-49-49-41.eu-north-1.compute.amazonaws.com`
- **Port:** `5432`
- **Database:** `edu_courses`
- **User:** `app`
- **Password:** `app` (change in production)

## Connection string (for backend)

```bash
DATABASE_URL="postgresql://app:app@ec2-13-49-49-41.eu-north-1.compute.amazonaws.com:5432/edu_courses?schema=public"
```

## AWS Security Group

Allow inbound TCP on port **5432** from:

- Your backend server’s IP, or
- `0.0.0.0/0` only if you need access from anywhere (less secure).

Then run migrations from your machine or CI:

```bash
cd backend
DATABASE_URL="postgresql://app:app@ec2-13-49-49-41.eu-north-1.compute.amazonaws.com:5432/edu_courses?schema=public" npx prisma migrate deploy
```

## SSH (for admin)

```bash
ssh -i /path/to/hosting.pem ec2-user@ec2-13-49-49-41.eu-north-1.compute.amazonaws.com
# Then: sudo -u postgres psql -d edu_courses
```

## Change app password (recommended)

On the EC2 instance:

```bash
sudo -u postgres psql -c "ALTER USER app WITH PASSWORD 'your_strong_password';"
```

Then set `DATABASE_URL` with the new password.
