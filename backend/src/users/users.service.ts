import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    private users = [
        {
            "id": 1,
            "name": "Brian Karani",
            "email": "brian@braines.com",
            "role": "INTERN"
        },
        {
            "id": 2,
            "name": "Royford Mutuma",
            "email": "roy@braines.com",
            "role": "INTERN"
        },
        {
            "id": 3,
            "name": "Evans Koome",
            "email": "evan@braines.com",
            "role": "ENGINEER"
        },
        {
            "id": 4,
            "name": "Phylis Nchabira",
            "email": "phylis@braines.com",
            "role": "ADMIN"
        },
        {
            "id": 5,
            "name": "John Muthuri",
            "email": "john@braines.com",
            "role": "ADMIN"
        }
    ]

    findAll(role?: 'INTERN' | 'ENGINEER' | 'ADMIN'){
        if (role){
            return this.users.filter(user => user.role === role)
        }
        return this.users
    }

    findOne(id:number){
        const user = this.users.filter(user => user.id === id)
        return user
    }

    createUser(user: {name:string, email:string, role?:'INTERN' | 'ENGINEER' | 'ADMIN'}){
        const userByHighestId = [...this.users].sort((a, b) => b.id - a.id)
        const newUser = {
            id: userByHighestId[0].id+1,
            ...user
        }
        this.users.push(newUser)
        return newUser
    }

    updateUser(id:number, updatedUser: {name?:string, email?:string, role?:'INTERN' | 'ENGINEER' | 'ADMIN'}){
        this.users = this.users.map(user => {
            if (user.id === id){
                return {...user, ...updatedUser}
            }
            return user
        })
        return this.findOne(id)
    }
    deleteUser(id:number){
        const removedUser = this.findOne(id)
        this.users = this.users.filter(user => user.id !== id)
        return removedUser
    }
}
