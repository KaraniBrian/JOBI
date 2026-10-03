import { Controller, Get, Param, Post, Body, Patch, Delete, Query } from '@nestjs/common';

@Controller('users')
export class UsersController {
   
    // @Get() //Get for all users
    // findAllUsers(){
    //     return []
    // }

    @Get()
    onUser(@Query('role') role?: 'Intern' | 'Admin' | 'Normal'){
        return [role]
    }

    @Get(':id') //Get using param
    oneUser(@Param('id') id:string){
    return {id}
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
