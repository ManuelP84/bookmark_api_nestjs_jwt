import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async signup(authDto: AuthDto) {
    try {
      // Generate the password hash
      const hash = await argon.hash(authDto.password);
      //Save the new user into the db
      const user = await this.prismaService.user.create({
        data: {
          email: authDto.email,
          hash,
        },
      });

      // Delete the hash from the return
      delete user.hash;

      //Return the new user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signin(authDto: AuthDto) {
    // Find the user in the database
    const user = await this.prismaService.user.findUnique({
      where: {
        email: authDto.email,
      },
    });
    // If the user doesnt exists throw an exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    //Compare password
    const passwordMatches = await argon.verify(user.hash, authDto.password);
    //If password is incorrect throw an exception
    if (!passwordMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }
    //Send back the user
    delete user.hash;
    return user;
  }
}
