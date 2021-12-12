use anchor_lang::prelude::*;

declare_id!("37tfCY74DTqFVkUDeouHMLvZjv8hDrEiw13HNBg6pViM");

#[program]
pub mod myprogram {
    use anchor_lang::solana_program::{program::invoke, system_instruction};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.pubkey_list = Vec::new();
        base_account.percentage_list = Vec::new();
        Ok(())
    }

    pub fn add_contract(ctx: Context<AddContract>, percentage_list: Vec<u64>, pubkey_list: Vec<Pubkey>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        
        for percentage in percentage_list.iter() {
            base_account.percentage_list.push(*percentage)
        }

        for pubkey in pubkey_list.iter() {
            base_account.pubkey_list.push(*pubkey)
        }

        Ok(())
    }

    pub fn execute_contract<'key, 'accounts, 'remaining, 'info>(
        ctx: Context<'key, 'accounts, 'remaining, 'info, ExecuteContract<'info>>,
        amount: u64,
    ) -> ProgramResult {

        let base_account = &mut ctx.accounts.base_account;
        let from = &mut ctx.accounts.from;
        let to_list = &ctx.remaining_accounts;
        let system_program = &ctx.accounts.system_program;
        let mut i = 0;

        for account in to_list.iter() {
            invoke(
                &system_instruction::transfer(
                    &from.key(),
                    &account.key(),
                    (amount / 100) * base_account.percentage_list[i],
                ),
                &[
                    from.to_account_info().clone(),
                    account.to_account_info().clone(),
                    system_program.to_account_info().clone(),
                ],
            )?;
            i = i + 1;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BaseAccount {
    pub pubkey_list: Vec<Pubkey>,
    pub percentage_list: Vec<u64>,
}

#[derive(Accounts)]
pub struct AddContract<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteContract<'info> {
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    from: Signer<'info>,
    system_program: AccountInfo<'info>,
}
