import mongoose from 'mongoose';
import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/redix_agency';

const coreTeam = [
    {
        name: 'Redix',
        email: 'redix@redix.agency',
        password: 'redix123',
        role: 'admin',
        teamRole: 'Full Admin',
        status: 'active'
    },
    {
        name: 'Moemen',
        email: 'moemen@redix.agency',
        password: 'el_mon',
        role: 'manager',
        teamRole: 'Manager',
        status: 'active'
    },
    {
        name: 'Yassine',
        email: 'yassine@redix.agency',
        password: 'pexa123',
        role: 'member',
        teamRole: 'Developer',
        status: 'active'
    }
];

async function seedCoreTeam() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        for (const member of coreTeam) {
            // Upsert User account
            let user = await User.findOne({ email: member.email });
            if (!user) {
                user = new User({
                    name: member.name,
                    email: member.email,
                    password: member.password,
                    role: member.role
                });
                await user.save();
                console.log(`Created user: ${member.name} (${member.email}) - password: ${member.password}`);
            } else {
                console.log(`User already exists: ${member.name} (${member.email})`);
            }

            // Upsert TeamMember entry
            let tm = await TeamMember.findOne({ email: member.email });
            if (!tm) {
                tm = new TeamMember({
                    name: member.name,
                    email: member.email,
                    role: member.teamRole,
                    status: member.status
                });
                await tm.save();
                console.log(`Created team member: ${member.name}`);
            } else {
                console.log(`Team member already exists: ${member.name}`);
            }
        }

        console.log('\nCore team seeded successfully!');
        console.log('Login credentials:');
        coreTeam.forEach(m => console.log(`  ${m.name}: ${m.email} / ${m.password}`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding core team:', error);
        process.exit(1);
    }
}

seedCoreTeam();
