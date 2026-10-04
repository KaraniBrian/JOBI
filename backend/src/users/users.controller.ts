import { Controller, Get, Param, Post, Body, Patch, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
   
constructor(private readonly usersService: UsersService){}
    @Get()
    findAll(@Query('role') role?: 'INTERN' | 'ENGINEER' | 'ADMIN'){
        return this.usersService.findAll(role)
    }

    @Get(':id') //Get using param
    findOne(@Param('id') id:string){
    return this.usersService.findOne(+id)
    }



    @Post()
    createUser(@Body() user:{}){
        return user
    }

    @Patch(':id') //Updataing user
    updateUser(@Param('id') id:string, @Body()  userupdated:{} ){
        return {id, ...userupdated}
    }

    @Delete(':id') //Delete using param
    deleteUser(@Param('id') id:string){
    return (id)
    }



}
